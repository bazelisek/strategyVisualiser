package cz.vko.stockstrategy.strategy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.vko.stockstrategy.model.StrategySourceFile;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;

class HybridTrendReversionStrategyTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void emitsTradesFromHybridPythonStrategy() throws Exception {
        Path workspace = Files.createTempDirectory("hybrid-trend-reversion");
        Path configFile = workspace.resolve("config.json");
        Path stockDataFile = workspace.resolve("stock-data.csv");

        // Load all files from catalog
        for (StrategySourceFile sourceFile : BuiltInStrategyCatalog.hybridTrendReversion().sourceFiles()) {
            Files.writeString(workspace.resolve(sourceFile.path()), sourceFile.content(), StandardCharsets.UTF_8);
        }

        // Configuration matching the defaults or specifically for testing
        Files.writeString(configFile, """
                {
                  "trendFastPeriod": 2,
                  "trendSlowPeriod": 5,
                  "adxPeriod": 3,
                  "adxThreshold": 20,
                  "rsiPeriod": 3,
                  "rsiOversold": 30,
                  "rsiOverbought": 70,
                  "bbPeriod": 5,
                  "bbStdDev": 1.0,
                  "atrPeriod": 3,
                  "atrMultiplier": 2.0
                }
                """, StandardCharsets.UTF_8);

        // Simple synthetic data: a sequence that should trigger a trend entry
        Files.writeString(stockDataFile, """
                ticker,tradeDate,tradeTime,open,high,low,close,volume
                HYB,2024-01-01,00:00,100,105,95,100,1000
                HYB,2024-01-02,00:00,100,105,95,100,1000
                HYB,2024-01-03,00:00,100,105,95,100,1000
                HYB,2024-01-04,00:00,100,105,95,100,1000
                HYB,2024-01-05,00:00,100,105,95,100,1000
                HYB,2024-01-06,00:00,110,115,105,110,1000
                HYB,2024-01-07,00:00,120,125,115,120,1000
                HYB,2024-01-08,00:00,130,135,125,130,1000
                HYB,2024-01-09,00:00,140,145,135,140,1000
                HYB,2024-01-10,00:00,150,155,145,150,1000
                HYB,2024-01-11,00:00,140,145,135,140,1000
                HYB,2024-01-12,00:00,130,135,125,130,1000
                """, StandardCharsets.UTF_8);

        ProcessBuilder pb = new ProcessBuilder("python3", "main.py");
        pb.directory(workspace.toFile());
        pb.environment().put("STRATEGY_CONFIG_FILE", configFile.toString());
        pb.environment().put("STRATEGY_STOCK_DATA_FILE", stockDataFile.toString());
        pb.redirectErrorStream(true);
        Process process = pb.start();

        // Wait, ProcessBuilder.env() takes a Map<String, String>, but I need to handle existing env if needed.
        // Actually, just using .inheritIO() or similar is easier, but for testing we want the output.
        
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        int exitCode = process.waitFor();

        assertThat(exitCode)
                .withFailMessage("Hybrid strategy execution failed:%n%s", output)
                .isZero();
        
        assertThat(output).contains("[hybrid-strategy] DEBUG Config loaded");
        
        String resultLine = output.lines()
                .filter(line -> line.startsWith("{"))
                .reduce((first, second) -> second)
                .orElseThrow();
        
        JsonNode result = objectMapper.readTree(resultLine);
        assertThat(result.path("status").asText()).isEqualTo("ok");
        assertThat(result.path("trades")).isNotEmpty();
        assertThat(StreamSupport.stream(result.path("trades").spliterator(), false))
                .allMatch(trade -> trade.hasNonNull("symbol")
                        && trade.hasNonNull("time")
                        && trade.hasNonNull("amount")
                        && trade.hasNonNull("price"));
    }
}
