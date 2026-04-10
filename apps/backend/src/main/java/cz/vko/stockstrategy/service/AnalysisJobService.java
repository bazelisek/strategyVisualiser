package cz.vko.stockstrategy.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@AllArgsConstructor
public class AnalysisJobService {

    private final AnalysisJobDao analysisJobDao;
    private final StrategyDao strategyDao;
    private final YahooFinanceService yahooFinanceService;
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

            String rawConfiguration = strategy.getConfiguration();
            String configurationJson = normalizeConfiguration(rawConfiguration);
            Files.writeString(configFile, configurationJson);

            StockDataRequest stockDataRequest = extractStockDataRequest(configurationJson);
            List<StockData> stockData = loadStockData(stockDataRequest);
            writeStockDataCsv(stockDataFile, stockData);
            writeJobContext(jobContextFile, job, strategy, stockDataRequest, stockDataFile, configFile, stockData.size());

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

    private String normalizeConfiguration(String rawConfiguration) {
        if (rawConfiguration == null || rawConfiguration.isBlank()) {
            return "{}";
        }
        return rawConfiguration;
    }

    private StockDataRequest extractStockDataRequest(String configurationJson) throws IOException {
        JsonNode root = objectMapper.readTree(configurationJson);
        JsonNode marketDataNode = root.path("marketData").isMissingNode() ? root : root.path("marketData");

        String symbol = textOrNull(marketDataNode, "symbol");
        String period = textOrDefault(marketDataNode, "period", "1d");
        LocalDate from = parseDate(textOrNull(marketDataNode, "from"));
        LocalDate to = parseDate(textOrNull(marketDataNode, "to"));

        return new StockDataRequest(symbol, period, from, to);
    }

    private List<StockData> loadStockData(StockDataRequest request) {
        if (request.symbol() == null || request.from() == null || request.to() == null) {
            return List.of();
        }
        return yahooFinanceService.getStockData(
                request.symbol(),
                request.period(),
                request.from(),
                request.to()
        );
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
            StockDataRequest request,
            Path stockDataFile,
            Path configFile,
            int stockRowCount
    ) throws IOException {
        Map<String, Object> stockDataRequest = new LinkedHashMap<>();
        stockDataRequest.put("symbol", request.symbol());
        stockDataRequest.put("period", request.period());
        stockDataRequest.put("from", request.from());
        stockDataRequest.put("to", request.to());

        Map<String, Object> jobContext = new LinkedHashMap<>();
        jobContext.put("jobId", job.getId());
        jobContext.put("strategyId", strategy.getId());
        jobContext.put("strategyName", strategy.getName());
        jobContext.put("configFile", configFile.getFileName().toString());
        jobContext.put("stockDataFile", stockDataFile.getFileName().toString());
        jobContext.put("stockDataRequest", stockDataRequest);
        jobContext.put("stockRowCount", stockRowCount);
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

    private String textOrDefault(JsonNode node, String fieldName, String defaultValue) {
        String text = textOrNull(node, fieldName);
        return text == null ? defaultValue : text;
    }

    private LocalDate parseDate(String value) {
        return value == null ? null : LocalDate.parse(value);
    }

    private String csvValue(Object value) {
        return value == null ? "" : value.toString();
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

    private record StockDataRequest(String symbol, String period, LocalDate from, LocalDate to) {
    }
}
