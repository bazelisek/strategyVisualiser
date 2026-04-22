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
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EmaAdxTrendStrategyTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void forcedExitUsesLastAvailableBarTime() throws Exception {
        Path workspace = Files.createTempDirectory("ema-adx-trend");
        Path sourceFile = workspace.resolve("StrategyMain.java");
        Path classesDir = workspace.resolve("classes");
        Path configFile = workspace.resolve("config.json");
        Path stockDataFile = workspace.resolve("stock-data.csv");

        Files.writeString(sourceFile, BuiltInStrategyCatalog.emaAdxTrend().code());
        Files.writeString(configFile, """
                {
                  "fastEmaPeriod": 2,
                  "slowEmaPeriod": 3,
                  "adxPeriod": 2,
                  "adxThreshold": 1.0,
                  "atrPeriod": 2,
                  "atrMultiplier": 10.0
                }
                """);
        Files.writeString(stockDataFile, """
                ticker,period,tradeDate,tradeTime,open,high,low,close,volume,openInterest
                BTC-USD,1d,2026-04-16,00:00:00,80000,80600,79800,80500,1000,0
                BTC-USD,1d,2026-04-17,00:00:00,80500,81200,80400,81000,1000,0
                BTC-USD,1d,2026-04-18,00:00:00,81000,81800,80900,81600,1000,0
                BTC-USD,1d,2026-04-19,00:00:00,81600,82500,81500,82300,1000,0
                BTC-USD,1d,2026-04-20,00:00:00,82300,83300,82200,83100,1000,0
                BTC-USD,1d,2026-04-21,00:00:00,83100,84200,83000,84000,1000,0
                """);

        compileStrategy(sourceFile, classesDir);
        JsonNode result = objectMapper.readTree(runStrategy(workspace, classesDir));
        JsonNode trades = result.path("trades");

        assertThat(result.path("status").asText()).isEqualTo("ok");
        assertThat(trades).hasSize(2);

        List<Integer> amounts = new ArrayList<>();
        List<Long> times = new ArrayList<>();
        for (JsonNode trade : trades) {
            amounts.add(trade.path("amount").asInt());
            times.add(trade.path("time").asLong());
        }

        assertThat(amounts).containsExactly(1, -1);
        assertThat(times.getLast()).isEqualTo(epochSeconds("2026-04-21", "00:00:00"));
        assertThat(times).allMatch(time -> time <= epochSeconds("2026-04-21", "00:00:00"));
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
