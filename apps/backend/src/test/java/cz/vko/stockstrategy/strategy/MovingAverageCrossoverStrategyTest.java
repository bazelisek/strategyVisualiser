package cz.vko.stockstrategy.strategy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import javax.tools.JavaCompiler;
import javax.tools.ToolProvider;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MovingAverageCrossoverStrategyTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void emitsExpectedCrossTradesWithoutDuplicateTradeTimes() throws Exception {
        Path workspace = Files.createTempDirectory("moving-average-crossover");
        Path sourceFile = workspace.resolve("StrategyMain.java");
        Path classesDir = workspace.resolve("classes");
        Path configFile = workspace.resolve("config.json");
        Path stockDataFile = workspace.resolve("stock-data.csv");

        Files.writeString(sourceFile, BuiltInStrategyCatalog.movingAverageCrossover().code());
        Files.writeString(configFile, """
                {
                  \"maRange1\": 2,
                  \"maRange2\": 3
                }
                """);
        Files.writeString(stockDataFile, """
                ticker,period,tradeDate,tradeTime,open,high,low,close,volume,openInterest
                AAPL,1d,2024-01-01,09:30:00,10,10,10,10,1000,0
                AAPL,1d,2024-01-02,09:30:00,10,10,10,10,1000,0
                AAPL,1d,2024-01-03,09:30:00,10,10,10,10,1000,0
                AAPL,1d,2024-01-04,09:30:00,12,12,12,12,1000,0
                AAPL,1d,2024-01-05,09:30:00,14,14,14,14,1000,0
                AAPL,1d,2024-01-06,09:30:00,8,8,8,8,1000,0
                AAPL,1d,2024-01-07,09:30:00,6,6,6,6,1000,0
                AAPL,1d,2024-01-08,09:30:00,9,9,9,9,1000,0
                AAPL,1d,2024-01-09,09:30:00,20,20,20,20,1000,0
                AAPL,1d,2024-01-10,09:30:00,8,8,8,8,1000,0
                """);

        compileStrategy(sourceFile, classesDir);
        String output = runStrategy(workspace, classesDir);
        JsonNode result = objectMapper.readTree(output);
        JsonNode trades = result.path("trades");

        assertThat(result.path("status").asText()).isEqualTo("ok");
        assertThat(result.path("maRange1").asInt()).isEqualTo(2);
        assertThat(result.path("maRange2").asInt()).isEqualTo(3);
        assertThat(trades).hasSize(1);

        List<Long> actualTimes = List.of(
                trades.get(0).path("time").asLong()
        );
        List<Integer> actualAmounts = List.of(
                trades.get(0).path("amount").asInt()
        );

        assertThat(actualTimes).containsExactly(
                epochSeconds("2024-01-09", "09:30:00")
        );
        assertThat(actualAmounts).containsExactly(1);
        assertThat(actualTimes).doesNotHaveDuplicates();
        assertThat(trades.get(0).path("symbol").asText()).isEqualTo("AAPL");
    }

    private void compileStrategy(Path sourceFile, Path classesDir) throws Exception {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        assertThat(compiler).isNotNull();
        Files.createDirectories(classesDir);

        ByteArrayOutputStream errorOutput = new ByteArrayOutputStream();
        int exitCode = compiler.run(
                null,
                null,
                errorOutput,
                "-encoding",
                StandardCharsets.UTF_8.name(),
                "-classpath",
                System.getProperty("java.class.path"),
                "-d",
                classesDir.toString(),
                sourceFile.toString()
        );

        assertThat(exitCode)
                .withFailMessage("Strategy compilation failed:%n%s", errorOutput.toString(StandardCharsets.UTF_8))
                .isZero();
    }

    private String runStrategy(Path workspace, Path classesDir) throws Exception {
        String classpath = classesDir + File.pathSeparator + System.getProperty("java.class.path");
        Process process = new ProcessBuilder("java", "-cp", classpath, "StrategyMain")
                .directory(workspace.toFile())
                .redirectErrorStream(true)
                .start();

        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        int exitCode = process.waitFor();

        assertThat(exitCode)
                .withFailMessage("Strategy execution failed:%n%s", output)
                .isZero();
        return output.trim();
    }

    private long epochSeconds(String date, String time) {
        return LocalDateTime.of(LocalDate.parse(date), LocalTime.parse(time)).toEpochSecond(ZoneOffset.UTC);
    }
}
