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

class PythonMovingAverageCrossoverStrategyTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void emitsTradesAndDebugLogsFromMultiplePythonFiles() throws Exception {
        Path workspace = Files.createTempDirectory("python-moving-average-crossover");
        Path configFile = workspace.resolve("config.json");
        Path stockDataFile = workspace.resolve("stock-data.csv");

        for (StrategySourceFile sourceFile : BuiltInStrategyCatalog.pythonMovingAverageCrossover().sourceFiles()) {
            Files.writeString(workspace.resolve(sourceFile.path()), sourceFile.content(), StandardCharsets.UTF_8);
        }

        Files.writeString(configFile, """
                {
                  "maRange1": 2,
                  "maRange2": 3,
                  "slopeLookback": 1
                }
                """, StandardCharsets.UTF_8);
        Files.writeString(stockDataFile, """
                ticker,period,tradeDate,tradeTime,open,high,low,close,volume,openInterest
                AAPL,1d,2024-01-01,00:00,10,10,10,10,1000,0
                AAPL,1d,2024-01-02,00:00,10,10,10,10,1000,0
                AAPL,1d,2024-01-03,00:00,10,10,10,10,1000,0
                AAPL,1d,2024-01-04,00:00,12,12,12,12,1000,0
                AAPL,1d,2024-01-05,00:00,14,14,14,14,1000,0
                AAPL,1d,2024-01-06,00:00,8,8,8,8,1000,0
                AAPL,1d,2024-01-07,00:00,6,6,6,6,1000,0
                AAPL,1d,2024-01-08,00:00,9,9,9,9,1000,0
                AAPL,1d,2024-01-09,00:00,20,20,20,20,1000,0
                AAPL,1d,2024-01-10,00:00,8,8,8,8,1000,0
                """, StandardCharsets.UTF_8);

        Process process = new ProcessBuilder("python3", "main.py")
                .directory(workspace.toFile())
                .redirectErrorStream(true)
                .start();

        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        int exitCode = process.waitFor();

        assertThat(exitCode)
                .withFailMessage("Python strategy execution failed:%n%s", output)
                .isZero();
        assertThat(output).contains("[python-ma] DEBUG Loading config");
        assertThat(output).contains("[python-ma] DEBUG BUY AAPL");

        String resultLine = output.lines()
                .filter(line -> !line.isBlank())
                .reduce((first, second) -> second)
                .orElseThrow();
        JsonNode result = objectMapper.readTree(resultLine);
        JsonNode trades = result.path("trades");

        assertThat(result.path("status").asText()).isEqualTo("ok");
        assertThat(result.path("runtime").asText()).isEqualTo("python");
        assertThat(result.path("slopeLookback").asInt()).isEqualTo(1);
        assertThat(trades).hasSize(3);

        List<Integer> amounts = StreamSupport.stream(trades.spliterator(), false)
                .map(trade -> trade.path("amount").asInt())
                .toList();
        List<Long> times = StreamSupport.stream(trades.spliterator(), false)
                .map(trade -> trade.path("time").asLong())
                .toList();

        assertThat(amounts).containsExactly(1, -1, 1);
        assertThat(times).containsExactly(
                epochSeconds("2024-01-04", "00:00:00"),
                epochSeconds("2024-01-06", "00:00:00"),
                epochSeconds("2024-01-09", "00:00:00")
        );
        assertThat(StreamSupport.stream(trades.spliterator(), false))
                .allSatisfy(trade -> assertThat(trade.path("symbol").asText()).isEqualTo("AAPL"));
    }

    private long epochSeconds(String date, String time) {
        return LocalDateTime.of(LocalDate.parse(date), LocalTime.parse(time)).toEpochSecond(ZoneOffset.UTC);
    }
}
