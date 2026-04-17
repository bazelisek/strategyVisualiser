package cz.vko.stockstrategy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.vko.stockstrategy.dto.AnalysisJobDTO;
import cz.vko.stockstrategy.dto.StrategyDTO;
import cz.vko.stockstrategy.model.StockData;
import cz.vko.stockstrategy.model.Strategy;
import cz.vko.stockstrategy.service.StockDataService;
import cz.vko.stockstrategy.service.StrategyExecutionRequest;
import cz.vko.stockstrategy.service.StrategyExecutionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class BackendServerIntegrationTest {

    private static final String STRATEGY_CODE = """
            public class StrategyMain {
                public static void main(String[] args) {
                    System.out.println("{\\"status\\":\\"strategy-ran\\"}");
                }
            }
            """;

    private static final String STRATEGY_CONFIGURATION = """
            [
              {
                "id": "universe",
                "label": "Universe",
                "type": "multi-select",
                "options": ["AAPL", "MSFT", "NVDA"],
                "defaultValue": ["AAPL", "MSFT"]
              },
              {
                "id": "lookbackWindow",
                "label": "Lookback Window",
                "type": "number",
                "defaultValue": 20
              },
              {
                "id": "benchmark",
                "label": "Benchmark",
                "type": "string",
                "defaultValue": "QQQ"
              },
              {
                "id": "useStops",
                "label": "Use Stops",
                "type": "boolean",
                "defaultValue": true
              }
            ]
            """;

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private StockDataService stockDataService;

    @MockBean
    private StrategyExecutionService strategyExecutionService;

    @BeforeEach
    void cleanWorkspace() throws IOException {
        deleteRecursively(Path.of("/tmp/strategyVisualizer"));
    }

    @Test
    void healthEndpointResponds() {
        ResponseEntity<String> response = restTemplate.getForEntity(url("/api/health"), String.class);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Trading API is running!", response.getBody());
    }

    @Test
    void createStrategyListStrategiesAndAnalyzeJob() throws Exception {
        AtomicReference<StrategyExecutionRequest> capturedRequest = new AtomicReference<>();

        when(stockDataService.getStockData(eq("AAPL"), eq("D"), eq(LocalDate.parse("2024-01-02")), eq(LocalDate.parse("2024-01-03"))))
                .thenReturn(sampleAaplStockDataInRange());
        when(stockDataService.getStockData(eq("MSFT"), eq("D"), eq(LocalDate.parse("2024-01-02")), eq(LocalDate.parse("2024-01-03"))))
                .thenReturn(sampleMsftStockData());

        when(strategyExecutionService.execute(any(), any())).thenAnswer(invocation -> {
            StrategyExecutionRequest request = invocation.getArgument(0);
            @SuppressWarnings("unchecked")
            Consumer<String> outputListener = invocation.getArgument(1, Consumer.class);
            capturedRequest.set(request);

            assertTrue(Files.exists(request.sourceFile()));
            assertTrue(Files.exists(request.configFile()));
            assertTrue(Files.exists(request.stockDataFile()));
            assertTrue(Files.exists(request.jobContextFile()));

            String source = Files.readString(request.sourceFile());
            JsonNode config = objectMapper.readTree(Files.readString(request.configFile()));
            List<String> csvLines = Files.readAllLines(request.stockDataFile());
            JsonNode jobContext = objectMapper.readTree(Files.readString(request.jobContextFile()));

            assertTrue(source.contains("class StrategyMain"));
            assertTrue(config.path("universe").isArray());
            assertEquals("AAPL", config.path("universe").get(0).asText());
            assertEquals("MSFT", config.path("universe").get(1).asText());
            assertEquals(10, config.path("lookbackWindow").asInt());
            assertEquals("SPY", config.path("benchmark").asText());
            assertFalse(config.path("useStops").asBoolean());
            assertEquals("AAPL", jobContext.path("universe").get(0).asText());
            assertEquals("MSFT", jobContext.path("universe").get(1).asText());
            assertEquals("2024-01-02", jobContext.path("rangeStart").asText());
            assertEquals("2024-01-03", jobContext.path("rangeEnd").asText());
            assertEquals(4, jobContext.path("stockRowCount").asInt());
            assertEquals(2, jobContext.path("stockRowCountBySymbol").path("AAPL").asInt());
            assertEquals(2, jobContext.path("stockRowCountBySymbol").path("MSFT").asInt());
            assertEquals(5, csvLines.size());
            assertTrue(csvLines.get(0).contains("ticker,period,tradeDate"));
            assertTrue(csvLines.get(1).startsWith("AAPL,1d,2024-01-02"));
            assertTrue(csvLines.get(3).startsWith("MSFT,1d,2024-01-02"));

            outputListener.accept("[strategy-runner] Compiling StrategyMain.java");
            outputListener.accept("[strategy-runner] Starting StrategyMain");

            return objectMapper.writeValueAsString(Map.of(
                    "status", "ok",
                    "universe", List.of("AAPL", "MSFT"),
                    "stockRows", 4,
                    "performance", 0.1234,
                    "trades", 2,
                    "winRate", 0.5
            ));
        });

        Map<String, Object> createPayload = Map.of(
                "name", "Frontend Integration Strategy",
                "description", "Created by HTTP integration test",
                "code", STRATEGY_CODE,
                "configuration", STRATEGY_CONFIGURATION
        );

        ResponseEntity<Strategy> createResponse = restTemplate.postForEntity(
                url("/api/strategies"),
                createPayload,
                Strategy.class
        );

        assertEquals(HttpStatus.CREATED, createResponse.getStatusCode());
        Strategy createdStrategy = createResponse.getBody();
        assertNotNull(createdStrategy);
        assertNotNull(createdStrategy.getId());
        assertEquals("Frontend Integration Strategy", createdStrategy.getName());

        ResponseEntity<StrategyDTO[]> listResponse = restTemplate.getForEntity(url("/api/strategies"), StrategyDTO[].class);
        assertEquals(HttpStatus.OK, listResponse.getStatusCode());
        assertNotNull(listResponse.getBody());
        assertTrue(List.of(listResponse.getBody()).stream().anyMatch(strategy -> strategy.getId().equals(createdStrategy.getId())));

        Map<String, Object> analyzePayload = Map.of(
                "symbol", "AAPL",
                "fromDate", "2024-01-02",
                "toDate", "2024-01-03",
                "config", Map.of(
                        "lookbackWindow", 10,
                        "benchmark", "SPY",
                        "useStops", false
                )
        );

        ResponseEntity<Map> analyzeResponse = restTemplate.postForEntity(
                url("/api/strategies/" + createdStrategy.getId() + "/analyze"),
                analyzePayload,
                Map.class
        );

        assertEquals(HttpStatus.ACCEPTED, analyzeResponse.getStatusCode());
        assertNotNull(analyzeResponse.getBody());
        Number jobIdNumber = (Number) analyzeResponse.getBody().get("job_id");
        assertNotNull(jobIdNumber);

        AnalysisJobDTO finishedJob = waitForJob(jobIdNumber.longValue());
        assertEquals("completed", finishedJob.getStatus());
        assertNull(finishedJob.getErrorMessage());
        assertEquals("[strategy-runner] Compiling StrategyMain.java\n[strategy-runner] Starting StrategyMain", finishedJob.getConsoleOutput());
        assertNotNull(finishedJob.getStartedAt());
        assertNotNull(finishedJob.getCompletedAt());
        assertFalse(finishedJob.getCompletedAt().isBefore(finishedJob.getStartedAt()));

        JsonNode result = objectMapper.readTree(finishedJob.getResult());
        assertEquals("ok", result.path("status").asText());
        assertEquals("AAPL", result.path("universe").get(0).asText());
        assertEquals("MSFT", result.path("universe").get(1).asText());
        assertEquals(4, result.path("stockRows").asInt());
        assertEquals(2, result.path("trades").asInt());
        assertEquals(0.5, result.path("winRate").asDouble(), 0.000001);
        assertEquals(0.1234, result.path("performance").asDouble(), 0.000001);

        StrategyExecutionRequest executionRequest = capturedRequest.get();
        assertNotNull(executionRequest);
        assertEquals(createdStrategy.getId(), executionRequest.strategyId());
        assertEquals(jobIdNumber.longValue(), executionRequest.jobId());
        verify(stockDataService).getStockData("AAPL", "D", LocalDate.parse("2024-01-02"), LocalDate.parse("2024-01-03"));
        verify(stockDataService).getStockData("MSFT", "D", LocalDate.parse("2024-01-02"), LocalDate.parse("2024-01-03"));
    }

    @Test
    void getJobStatusFiltersTradesByRequestedSymbol() throws Exception {
        when(stockDataService.getStockData(eq("AAPL"), eq("D"), eq(LocalDate.parse("2024-01-02")), eq(LocalDate.parse("2024-01-03"))))
                .thenReturn(sampleAaplStockDataInRange());
        when(stockDataService.getStockData(eq("MSFT"), eq("D"), eq(LocalDate.parse("2024-01-02")), eq(LocalDate.parse("2024-01-03"))))
                .thenReturn(sampleMsftStockData());

        when(strategyExecutionService.execute(any(), any())).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Consumer<String> outputListener = invocation.getArgument(1, Consumer.class);
            outputListener.accept("streaming trade debug");
            return objectMapper.writeValueAsString(Map.of(
                    "status", "ok",
                    "trades", List.of(
                            Map.of("symbol", "AAPL", "time", 1704187800L, "amount", 1),
                            Map.of("symbol", "MSFT", "time", 1704187800L, "amount", -1)
                    )
            ));
        });

        Map<String, Object> createPayload = Map.of(
                "name", "Filter by Symbol Strategy",
                "description", "Verifies job result symbol filtering",
                "code", STRATEGY_CODE,
                "configuration", STRATEGY_CONFIGURATION
        );

        ResponseEntity<Strategy> createResponse = restTemplate.postForEntity(
                url("/api/strategies"),
                createPayload,
                Strategy.class
        );

        assertEquals(HttpStatus.CREATED, createResponse.getStatusCode());
        Strategy createdStrategy = createResponse.getBody();
        assertNotNull(createdStrategy);
        assertNotNull(createdStrategy.getId());

        Map<String, Object> analyzePayload = Map.of(
                "symbol", "AAPL",
                "fromDate", "2024-01-02",
                "toDate", "2024-01-03",
                "config", Map.of()
        );

        ResponseEntity<Map> analyzeResponse = restTemplate.postForEntity(
                url("/api/strategies/" + createdStrategy.getId() + "/analyze"),
                analyzePayload,
                Map.class
        );

        assertEquals(HttpStatus.ACCEPTED, analyzeResponse.getStatusCode());
        assertNotNull(analyzeResponse.getBody());
        Number jobIdNumber = (Number) analyzeResponse.getBody().get("job_id");
        assertNotNull(jobIdNumber);

        waitForJob(jobIdNumber.longValue());

        ResponseEntity<AnalysisJobDTO> filteredResponse = restTemplate.getForEntity(
                url("/api/jobs/" + jobIdNumber.longValue() + "?symbol=AAPL"),
                AnalysisJobDTO.class
        );

        assertEquals(HttpStatus.OK, filteredResponse.getStatusCode());
        AnalysisJobDTO filteredJob = filteredResponse.getBody();
        assertNotNull(filteredJob);
        JsonNode filteredResult = objectMapper.readTree(filteredJob.getResult());
        assertEquals(1, filteredResult.path("trades").size());
        assertEquals("AAPL", filteredResult.path("trades").get(0).path("symbol").asText());
        assertEquals(1704187800L, filteredResult.path("trades").get(0).path("time").asLong());
    }

    @Test
    void analyzeMissingStrategyReturnsBadRequest() {
        ResponseEntity<Map> response = restTemplate.postForEntity(
                url("/api/strategies/999999/analyze"),
                Map.of(),
                Map.class
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Strategy not found: 999999", response.getBody().get("error"));
    }

    private AnalysisJobDTO waitForJob(long jobId) throws InterruptedException {
        Instant deadline = Instant.now().plus(Duration.ofSeconds(5));
        AnalysisJobDTO latest = null;

        while (Instant.now().isBefore(deadline)) {
            ResponseEntity<AnalysisJobDTO> response = restTemplate.getForEntity(
                    url("/api/jobs/" + jobId),
                    AnalysisJobDTO.class
            );
            assertEquals(HttpStatus.OK, response.getStatusCode());
            latest = response.getBody();
            assertNotNull(latest);

            if ("completed".equals(latest.getStatus()) || "failed".equals(latest.getStatus())) {
                return latest;
            }

            Thread.sleep(100);
        }

        throw new AssertionError("Timed out waiting for job " + jobId + " to finish. Last state: " + (latest == null ? "null" : latest.getStatus()));
    }

    private List<StockData> sampleAaplStockData() {
        return List.of(
                stockData("AAPL", "1d", "2024-01-02", "09:30:00", "185.64", "186.91", "184.35", "185.64", 82488700L),
                stockData("AAPL", "1d", "2024-01-03", "09:30:00", "184.22", "185.88", "183.43", "184.25", 58414500L),
                stockData("AAPL", "1d", "2024-01-04", "09:30:00", "182.15", "183.09", "180.88", "181.91", 71983600L)
        );
    }

    private List<StockData> sampleAaplStockDataInRange() {
        return List.of(
                stockData("AAPL", "1d", "2024-01-02", "09:30:00", "185.64", "186.91", "184.35", "185.64", 82488700L),
                stockData("AAPL", "1d", "2024-01-03", "09:30:00", "184.22", "185.88", "183.43", "184.25", 58414500L)
        );
    }

    private List<StockData> sampleMsftStockData() {
        return List.of(
                stockData("MSFT", "1d", "2024-01-02", "09:30:00", "373.86", "375.90", "366.51", "370.87", 25258600L),
                stockData("MSFT", "1d", "2024-01-03", "09:30:00", "369.01", "373.26", "368.51", "370.60", 23083500L)
        );
    }

    private StockData stockData(
            String ticker,
            String period,
            String tradeDate,
            String tradeTime,
            String open,
            String high,
            String low,
            String close,
            long volume
    ) {
        StockData stockData = new StockData();
        stockData.setTicker(ticker);
        stockData.setPeriod(period);
        stockData.setTradeDate(LocalDate.parse(tradeDate));
        stockData.setTradeTime(LocalTime.parse(tradeTime));
        stockData.setOpen(new BigDecimal(open));
        stockData.setHigh(new BigDecimal(high));
        stockData.setLow(new BigDecimal(low));
        stockData.setClose(new BigDecimal(close));
        stockData.setVolume(volume);
        stockData.setOpenInterest(0L);
        return stockData;
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private void deleteRecursively(Path root) throws IOException {
        if (!Files.exists(root)) {
            return;
        }
        try (var paths = Files.walk(root)) {
            paths.sorted((left, right) -> right.getNameCount() - left.getNameCount())
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    });
        }
    }
}
