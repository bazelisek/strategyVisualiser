package cz.vko.stockstrategy.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import cz.vko.stockstrategy.dao.AnalysisJobDao;
import cz.vko.stockstrategy.dao.StrategyDao;
import cz.vko.stockstrategy.dto.AnalysisJobDTO;
import cz.vko.stockstrategy.model.AnalysisJob;
import cz.vko.stockstrategy.model.StockData;
import cz.vko.stockstrategy.model.Strategy;
import lombok.AllArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class AnalysisJobService {

    private final AnalysisJobDao analysisJobDao;
    private final StrategyDao strategyDao;
    private final StockDataService stockDataService;
    private final StrategyExecutionService strategyExecutionService;
    private final ObjectMapper objectMapper;

    public AnalysisJob createAnalysisJob(Long strategyId) {
        // Verify strategy exists
        Optional<Strategy> strategy = strategyDao.findById(strategyId);
        if (strategy.isEmpty()) {
            throw new IllegalArgumentException("Strategy not found: " + strategyId);
        }

        AnalysisJob job = new AnalysisJob();
        job.setStrategyId(strategyId);
        job.setStatus("pending");
        job.setCreatedAt(LocalDateTime.now());

        return analysisJobDao.save(job);
    }

    public Optional<AnalysisJobDTO> getJobById(Long jobId) {
        return analysisJobDao.findById(jobId)
                .map(this::convertToDTO);
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

            ResolvedStrategyConfiguration resolvedConfiguration = resolveConfiguration(strategy.getConfiguration());
            Files.writeString(configFile, resolvedConfiguration.executionConfigurationJson());

            List<StockData> stockData = loadStockData(resolvedConfiguration.universe());
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
            ));

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

    private AnalysisJobDTO convertToDTO(AnalysisJob job) {
        AnalysisJobDTO dto = new AnalysisJobDTO();
        dto.setId(job.getId());
        dto.setStrategyId(job.getStrategyId());
        dto.setStatus(job.getStatus());
        dto.setResult(job.getResult());
        dto.setErrorMessage(job.getErrorMessage());
        dto.setCreatedAt(job.getCreatedAt());
        dto.setStartedAt(job.getStartedAt());
        dto.setCompletedAt(job.getCompletedAt());
        return dto;
    }

    private ResolvedStrategyConfiguration resolveConfiguration(String rawConfiguration) throws IOException {
        if (rawConfiguration == null || rawConfiguration.isBlank()) {
            return new ResolvedStrategyConfiguration("{}", List.of());
        }

        JsonNode root = objectMapper.readTree(rawConfiguration);
        if (root.isArray()) {
            return resolveConfigurationOptions((ArrayNode) root);
        }
        if (root.isObject()) {
            return resolveLegacyConfiguration((ObjectNode) root);
        }
        throw new IllegalArgumentException("Strategy configuration must be a JSON object or array.");
    }

    private ResolvedStrategyConfiguration resolveConfigurationOptions(ArrayNode options) throws IOException {
        ObjectNode executionConfiguration = objectMapper.createObjectNode();
        List<String> universe = List.of();

        for (JsonNode optionNode : options) {
            if (!optionNode.isObject()) {
                continue;
            }

            String id = textOrNull(optionNode, "id");
            if (id == null) {
                continue;
            }

            JsonNode defaultValue = optionNode.get("defaultValue");
            if (defaultValue == null || defaultValue.isNull()) {
                executionConfiguration.putNull(id);
            } else {
                executionConfiguration.set(id, defaultValue.deepCopy());
            }

            if ("universe".equals(id)) {
                universe = extractUniverse(defaultValue);
            }
        }

        return new ResolvedStrategyConfiguration(
                objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(executionConfiguration),
                universe
        );
    }

    private ResolvedStrategyConfiguration resolveLegacyConfiguration(ObjectNode root) throws IOException {
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

    private List<StockData> loadStockData(List<String> universe) {
        List<String> symbols = loadUniverse(universe);
        if (symbols.isEmpty()) {
            return List.of();
        }

        List<StockData> stockData = new ArrayList<>();
        for (String symbol : symbols) {
            stockData.addAll(stockDataService.getStockData(symbol));
        }
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
            rowsBySymbol.merge(row.getTicker(), 1L, Long::sum);
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

    private record ResolvedStrategyConfiguration(String executionConfigurationJson, List<String> universe) {
    }
}
