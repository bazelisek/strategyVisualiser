package cz.vko.stockstrategy.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import cz.vko.stockstrategy.dao.AnalysisJobDao;
import cz.vko.stockstrategy.dao.StrategyDao;
import cz.vko.stockstrategy.dto.AnalyzeStrategyRequestDTO;
import cz.vko.stockstrategy.dto.AnalysisJobDTO;
import cz.vko.stockstrategy.model.AnalysisJob;
import cz.vko.stockstrategy.model.StockData;
import cz.vko.stockstrategy.model.Strategy;
import lombok.AllArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class AnalysisJobService {

    private final AnalysisJobDao analysisJobDao;
    private final StrategyDao strategyDao;
    private final StockDataService stockDataService;
    private final YahooFinanceService yahooFinanceService;
    private final StrategyExecutionService strategyExecutionService;
    private final ObjectMapper objectMapper;

    public AnalysisJob createAnalysisJob(Long strategyId, AnalyzeStrategyRequestDTO request) {
        Optional<Strategy> strategy = strategyDao.findById(strategyId);
        if (strategy.isEmpty()) {
            throw new IllegalArgumentException("Strategy not found: " + strategyId);
        }

        AnalyzeStrategyRequestDTO effectiveRequest = request == null ? new AnalyzeStrategyRequestDTO() : request;
        validateDateRange(effectiveRequest.getFromDate(), effectiveRequest.getToDate());
        ResolvedStrategyConfiguration resolvedConfiguration = resolveConfiguration(
                strategy.get().getConfiguration(),
                effectiveRequest.getConfig()
        );
        String configSignature = buildConfigSignature(strategyId, resolvedConfiguration.executionConfigurationJson());

        Optional<AnalysisJob> exactMatch = analysisJobDao.findCompletedByExactRange(
                strategyId,
                configSignature,
                effectiveRequest.getFromDate(),
                effectiveRequest.getToDate()
        );
        if (exactMatch.isPresent()) {
            return createReusedJob(strategyId, resolvedConfiguration, effectiveRequest, exactMatch.get());
        }

        Optional<AnalysisJob> containedRangeMatch = analysisJobDao.findCompletedContainingRange(
                strategyId,
                configSignature,
                effectiveRequest.getFromDate(),
                effectiveRequest.getToDate()
        );
        if (containedRangeMatch.isPresent()) {
            return createReusedJob(strategyId, resolvedConfiguration, effectiveRequest, containedRangeMatch.get());
        }

        AnalysisJob job = new AnalysisJob();
        job.setStrategyId(strategyId);
        job.setStatus("pending");
        job.setConfigSignature(configSignature);
        job.setConfigPayload(resolvedConfiguration.executionConfigurationJson());
        job.setRangeStart(effectiveRequest.getFromDate());
        job.setRangeEnd(effectiveRequest.getToDate());
        job.setCreatedAt(LocalDateTime.now());

        return analysisJobDao.save(job);
    }

    public Optional<AnalysisJobDTO> getJobById(Long jobId) {
        return getJobById(jobId, null);
    }

    public Optional<AnalysisJobDTO> getJobById(Long jobId, String symbol) {
        return analysisJobDao.findById(jobId)
                .map(job -> convertToDTO(job, symbol));
    }

    @Async
    public void executeAnalysisJob(Long jobId) {
        Optional<AnalysisJob> jobOpt = analysisJobDao.findById(jobId);
        if (jobOpt.isEmpty()) {
            return;
        }

        AnalysisJob job = jobOpt.get();

        try {
            // Update status to running
            job.setStatus("running");
            job.setStartedAt(LocalDateTime.now());
            job.setConsoleOutput("");
            analysisJobDao.save(job);

            Path workspaceDir = Paths.get("/tmp/strategyVisualizer", "job_" + job.getId());
            Files.createDirectories(workspaceDir);

            long strategyId = job.getStrategyId();
            Strategy strategy = strategyDao.findById(strategyId)
                    .orElseThrow(() -> new IllegalArgumentException("Strategy not found: " + strategyId));
            String code = strategy.getCode();
            Path sourceFile = workspaceDir.resolve("StrategyMain.java");
            Files.writeString(sourceFile, code);
            Path configFile = workspaceDir.resolve("config.json");
            Path stockDataFile = workspaceDir.resolve("stock-data.csv");
            Path jobContextFile = workspaceDir.resolve("job-context.json");

            ResolvedStrategyConfiguration resolvedConfiguration = resolveConfiguration(
                    job.getConfigPayload() == null || job.getConfigPayload().isBlank() ? strategy.getConfiguration() : job.getConfigPayload(),
                    null
            );
            Files.writeString(configFile, resolvedConfiguration.executionConfigurationJson());

            List<StockData> stockData = loadStockData(resolvedConfiguration.universe(), job.getRangeStart(), job.getRangeEnd());
            writeStockDataCsv(stockDataFile, stockData);
            writeJobContext(jobContextFile, job, strategy, resolvedConfiguration, stockDataFile, configFile, stockData);

            String output = strategyExecutionService.execute(new StrategyExecutionRequest(
                    workspaceDir,
                    sourceFile,
                    configFile,
                    stockDataFile,
                    jobContextFile,
                    job.getId(),
                    strategy.getId()
            ), line -> appendConsoleOutput(job, line));

            String sanitizedOutput = sanitizeStrategyOutput(output);
            job.setStatus("completed");
            job.setResult(sanitizedOutput.isBlank() ? "{\"status\":\"ok\"}" : sanitizedOutput);
            job.setCompletedAt(LocalDateTime.now());

        } catch (Exception e) {
            job.setStatus("failed");
            job.setErrorMessage(e.getMessage());
            job.setCompletedAt(LocalDateTime.now());
        }

        analysisJobDao.save(job);
    }

    private AnalysisJobDTO convertToDTO(AnalysisJob job, String symbol) {
        AnalysisJobDTO dto = new AnalysisJobDTO();
        dto.setId(job.getId());
        dto.setStrategyId(job.getStrategyId());
        dto.setStatus(job.getStatus());
        dto.setResult(filterResultBySymbol(job.getResult(), symbol));
        dto.setErrorMessage(job.getErrorMessage());
        dto.setConsoleOutput(job.getConsoleOutput());
        dto.setCreatedAt(job.getCreatedAt());
        dto.setStartedAt(job.getStartedAt());
        dto.setCompletedAt(job.getCompletedAt());
        return dto;
    }

    private ResolvedStrategyConfiguration resolveConfiguration(String rawConfiguration, Map<String, Object> overrides) {
        if (rawConfiguration == null || rawConfiguration.isBlank()) {
            return new ResolvedStrategyConfiguration("{}", List.of());
        }

        try {
            JsonNode root = objectMapper.readTree(rawConfiguration);
            if (root.isArray()) {
                return resolveConfigurationOptions((ArrayNode) root, overrides);
            }
            if (root.isObject()) {
                return resolveLegacyConfiguration((ObjectNode) root, overrides);
            }
            throw new IllegalArgumentException("Strategy configuration must be a JSON object or array.");
        } catch (IOException e) {
            throw new IllegalArgumentException("Unable to parse strategy configuration.", e);
        }
    }

    private ResolvedStrategyConfiguration resolveConfigurationOptions(ArrayNode options, Map<String, Object> overrides) throws IOException {
        ObjectNode executionConfiguration = objectMapper.createObjectNode();
        List<String> universe = List.of();
        Map<String, Object> safeOverrides = overrides == null ? Map.of() : overrides;

        for (JsonNode optionNode : options) {
            if (!optionNode.isObject()) {
                continue;
            }

            String id = textOrNull(optionNode, "id");
            if (id == null) {
                continue;
            }

            JsonNode defaultValue = optionNode.get("defaultValue");
            if (safeOverrides.containsKey(id)) {
                defaultValue = objectMapper.valueToTree(safeOverrides.get(id));
            }
            if (defaultValue == null || defaultValue.isNull()) {
                executionConfiguration.putNull(id);
            } else {
                executionConfiguration.set(id, defaultValue.deepCopy());
            }

            if ("universe".equals(id)) {
                universe = extractUniverse(defaultValue);
            }
        }

        if (universe.isEmpty() && safeOverrides.containsKey("universe")) {
            JsonNode universeOverride = objectMapper.valueToTree(safeOverrides.get("universe"));
            executionConfiguration.set("universe", universeOverride);
            universe = extractUniverse(universeOverride);
        }

        return new ResolvedStrategyConfiguration(
                objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(executionConfiguration),
                universe
        );
    }

    private ResolvedStrategyConfiguration resolveLegacyConfiguration(ObjectNode root, Map<String, Object> overrides) throws IOException {
        if (overrides != null && !overrides.isEmpty()) {
            overrides.forEach((key, value) -> root.set(key, objectMapper.valueToTree(value)));
        }
        List<String> universe = extractUniverse(root.get("universe"));
        if (universe.isEmpty()) {
            JsonNode marketDataNode = root.path("marketData").isMissingNode() ? root : root.path("marketData");
            universe = extractUniverse(marketDataNode.get("universe"));
            if (universe.isEmpty()) {
                String symbol = textOrNull(marketDataNode, "symbol");
                universe = symbol == null ? List.of() : List.of(symbol);
            }
        }

        return new ResolvedStrategyConfiguration(
                objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root),
                universe
        );
    }

    private List<String> loadUniverse(List<String> rawUniverse) {
        return rawUniverse.stream()
                .filter(symbol -> symbol != null && !symbol.isBlank())
                .map(String::trim)
                .collect(Collectors.collectingAndThen(
                        Collectors.toCollection(LinkedHashSet::new),
                        ArrayList::new
                ));
    }

    private List<String> extractUniverse(JsonNode universeNode) {
        if (universeNode == null || !universeNode.isArray()) {
            return List.of();
        }

        List<String> symbols = new ArrayList<>();
        for (JsonNode symbolNode : universeNode) {
            if (!symbolNode.isTextual()) {
                continue;
            }
            String symbol = symbolNode.asText();
            if (symbol != null && !symbol.isBlank()) {
                symbols.add(symbol.trim());
            }
        }
        return loadUniverse(symbols);
    }

    private List<StockData> loadStockData(List<String> universe, LocalDate fromDate, LocalDate toDate) {
        List<String> symbols = loadUniverse(universe);
        if (symbols.isEmpty()) {
            return List.of();
        }

        List<StockData> stockData = new ArrayList<>();
        for (String symbol : symbols) {
            if (fromDate != null && toDate != null) {
                List<StockData> symbolData = stockDataService.getStockData(symbol, "D", fromDate, toDate);
                if (symbolData.isEmpty()) {
                    List<StockData> yahooData = yahooFinanceService.getStockData(symbol, "1d", fromDate, toDate);
                    if (!yahooData.isEmpty()) {
                        stockDataService.saveIfMissing(yahooData);
                        symbolData = stockDataService.getStockData(symbol, "D", fromDate, toDate);
                    }
                }
                stockData.addAll(symbolData);
            } else {
                stockData.addAll(stockDataService.getStockData(symbol));
            }
        }
        stockData.sort(Comparator.comparing(StockData::getTicker)
                .thenComparing(StockData::getTradeDate)
                .thenComparing(StockData::getTradeTime));
        return stockData;
    }

    private void writeStockDataCsv(Path stockDataFile, List<StockData> stockData) throws IOException {
        StringBuilder csv = new StringBuilder("ticker,period,tradeDate,tradeTime,open,high,low,close,volume,openInterest")
                .append(System.lineSeparator());

        for (StockData row : stockData) {
            csv.append(csvValue(row.getTicker())).append(',')
                    .append(csvValue(row.getPeriod())).append(',')
                    .append(csvValue(row.getTradeDate())).append(',')
                    .append(csvValue(row.getTradeTime())).append(',')
                    .append(csvValue(row.getOpen())).append(',')
                    .append(csvValue(row.getHigh())).append(',')
                    .append(csvValue(row.getLow())).append(',')
                    .append(csvValue(row.getClose())).append(',')
                    .append(csvValue(row.getVolume())).append(',')
                    .append(csvValue(row.getOpenInterest()))
                    .append(System.lineSeparator());
        }

        Files.writeString(stockDataFile, csv.toString());
    }

    private void writeJobContext(
            Path jobContextFile,
            AnalysisJob job,
            Strategy strategy,
            ResolvedStrategyConfiguration resolvedConfiguration,
            Path stockDataFile,
            Path configFile,
            List<StockData> stockData
    ) throws IOException {
        Map<String, Object> jobContext = new LinkedHashMap<>();
        jobContext.put("jobId", job.getId());
        jobContext.put("strategyId", strategy.getId());
        jobContext.put("strategyName", strategy.getName());
        jobContext.put("configFile", configFile.getFileName().toString());
        jobContext.put("stockDataFile", stockDataFile.getFileName().toString());
        jobContext.put("universe", resolvedConfiguration.universe());
        jobContext.put("rangeStart", job.getRangeStart() == null ? null : job.getRangeStart().toString());
        jobContext.put("rangeEnd", job.getRangeEnd() == null ? null : job.getRangeEnd().toString());
        jobContext.put("stockRowCount", stockData.size());
        jobContext.put("stockRowCountBySymbol", summarizeStockRows(stockData));
        Files.writeString(jobContextFile, objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(jobContext));
    }

    private String textOrNull(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text == null || text.isBlank() ? null : text;
    }

    private String csvValue(Object value) {
        return value == null ? "" : value.toString();
    }

    private Map<String, Long> summarizeStockRows(List<StockData> stockData) {
        Map<String, Long> rowsBySymbol = new LinkedHashMap<>();
        for (StockData row : stockData) {
            String ticker = row.getTicker();
            if (ticker == null || ticker.isBlank()) {
                continue;
            }
            rowsBySymbol.merge(ticker, 1L, Long::sum);
        }
        return rowsBySymbol;
    }

    private String sanitizeStrategyOutput(String output) {
        if (output == null || output.isBlank()) {
            return "";
        }

        String[] lines = output.split("\\R");
        for (int i = lines.length - 1; i >= 0; i--) {
            String line = lines[i].trim();
            if (!line.isBlank() && (line.startsWith("{") || line.startsWith("["))) {
                return line;
            }
        }

        return output.trim();
    }

    private String filterResultBySymbol(String rawResult, String symbol) {
        if (rawResult == null || rawResult.isBlank() || symbol == null || symbol.isBlank()) {
            return rawResult;
        }

        try {
            JsonNode root = objectMapper.readTree(rawResult);
            JsonNode filtered = filterNodeBySymbol(root, symbol.trim());
            return objectMapper.writeValueAsString(filtered);
        } catch (Exception ignored) {
            return rawResult;
        }
    }

    private JsonNode filterNodeBySymbol(JsonNode node, String symbol) {
        if (node == null || node.isNull()) {
            return node;
        }

        if (node.isArray()) {
            ArrayNode filteredArray = objectMapper.createArrayNode();
            for (JsonNode item : node) {
                if (!item.isObject() && !item.isArray()) {
                    filteredArray.add(item.deepCopy());
                    continue;
                }
                if (item.isObject()) {
                    if (matchesSymbol(item, symbol)) {
                        filteredArray.add(item.deepCopy());
                        continue;
                    }
                    if (hasExplicitSymbolField(item)) {
                        continue;
                    }
                }
                JsonNode nested = filterNodeBySymbol(item, symbol);
                if (nested != null && !nested.isNull() && (!nested.isArray() || nested.size() > 0) && (!nested.isObject() || nested.size() > 0)) {
                    filteredArray.add(nested);
                }
            }
            return filteredArray;
        }

        if (node.isObject()) {
            ObjectNode objectNode = objectMapper.createObjectNode();
            node.properties().forEach(entry -> {
                JsonNode value = entry.getValue();
                if (value.isObject() && value.has(symbol)) {
                    objectNode.set(entry.getKey(), value.get(symbol).deepCopy());
                    return;
                }
                objectNode.set(entry.getKey(), filterNodeBySymbol(value, symbol));
            });
            return objectNode;
        }

        return node.deepCopy();
    }

    private boolean matchesSymbol(JsonNode node, String symbol) {
        if (node == null || !node.isObject()) {
            return false;
        }
        return symbol.equalsIgnoreCase(textOrNull(node, "symbol"))
                || symbol.equalsIgnoreCase(textOrNull(node, "ticker"))
                || symbol.equalsIgnoreCase(textOrNull(node, "instrument"));
    }

    private boolean hasExplicitSymbolField(JsonNode node) {
        return node != null
                && node.isObject()
                && (node.hasNonNull("symbol") || node.hasNonNull("ticker") || node.hasNonNull("instrument"));
    }

    private void appendConsoleOutput(AnalysisJob job, String line) {
        String currentOutput = job.getConsoleOutput();
        String nextOutput = (currentOutput == null || currentOutput.isBlank())
                ? line
                : currentOutput + System.lineSeparator() + line;
        job.setConsoleOutput(nextOutput);
        analysisJobDao.save(job);
    }

    private AnalysisJob createReusedJob(
            Long strategyId,
            ResolvedStrategyConfiguration configuration,
            AnalyzeStrategyRequestDTO request,
            AnalysisJob reusedSource
    ) {
        AnalysisJob reusedJob = new AnalysisJob();
        reusedJob.setStrategyId(strategyId);
        reusedJob.setStatus("completed");
        reusedJob.setResult(reusedSource.getResult());
        reusedJob.setConsoleOutput(reusedSource.getConsoleOutput());
        reusedJob.setConfigSignature(reusedSource.getConfigSignature());
        reusedJob.setConfigPayload(configuration.executionConfigurationJson());
        reusedJob.setRangeStart(request.getFromDate());
        reusedJob.setRangeEnd(request.getToDate());
        reusedJob.setReusedFromJobId(reusedSource.getId());
        reusedJob.setCreatedAt(LocalDateTime.now());
        reusedJob.setStartedAt(LocalDateTime.now());
        reusedJob.setCompletedAt(LocalDateTime.now());
        return analysisJobDao.save(reusedJob);
    }

    private String buildConfigSignature(Long strategyId, String executionConfigurationJson) {
        try {
            JsonNode canonicalNode = canonicalize(objectMapper.readTree(executionConfigurationJson));
            String payload = strategyId + ":" + objectMapper.writeValueAsString(canonicalNode);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte b : hash) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (IOException | NoSuchAlgorithmException e) {
            throw new IllegalArgumentException("Unable to compute configuration signature.", e);
        }
    }

    private JsonNode canonicalize(JsonNode node) {
        if (node == null || node.isNull()) {
            return node;
        }
        if (node.isArray()) {
            ArrayNode canonical = objectMapper.createArrayNode();
            node.forEach(child -> canonical.add(canonicalize(child)));
            return canonical;
        }
        if (node.isObject()) {
            ObjectNode canonical = objectMapper.createObjectNode();
            TreeMap<String, JsonNode> sorted = new TreeMap<>();
            node.properties().forEach(entry -> sorted.put(entry.getKey(), canonicalize(entry.getValue())));
            sorted.forEach(canonical::set);
            return canonical;
        }
        return node.deepCopy();
    }

    private void validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("fromDate must be before or equal to toDate.");
        }
    }

    private record ResolvedStrategyConfiguration(String executionConfigurationJson, List<String> universe) {
    }
}
