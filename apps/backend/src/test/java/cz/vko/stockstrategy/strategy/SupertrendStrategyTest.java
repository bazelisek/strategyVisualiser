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
import static org.assertj.core.api.Assertions.fail;

class SupertrendStrategyTest {

    private static final List<StepExpectation> EXPECTED_STEPS = List.of(
            new StepExpectation(0, 3, epochSeconds("2024-01-04", "09:30:00"), 6.666666666666667, 110.66666666666667, 97.33333333333333, 0.0, 97.33333333333333, 0.0, -100.0, 100.0),
            new StepExpectation(1, 4, epochSeconds("2024-01-05", "09:30:00"), 7.444444444444445, 114.44444444444444, 99.55555555555556, 114.44444444444444, 99.55555555555556, 114.44444444444444, 4.994903160040773, -4.994903160040773),
            new StepExpectation(2, 5, epochSeconds("2024-01-06", "09:30:00"), 6.962962962962963, 117.96296296296296, 104.03703703703704, 114.44444444444444, 104.03703703703704, 114.44444444444444, 1.2782694198623388, -1.2782694198623388),
            new StepExpectation(3, 6, epochSeconds("2024-01-07", "09:30:00"), 6.6419753086419755, 121.64197530864197, 108.35802469135803, 114.44444444444444, 108.35802469135803, 108.35802469135803, -7.386303682599979, 7.386303682599979),
            new StepExpectation(4, 7, epochSeconds("2024-01-08", "09:30:00"), 7.094650205761317, 119.59465020576131, 105.40534979423869, 119.59465020576131, 108.35802469135803, 108.35802469135803, -2.3801579357134903, 2.3801579357134903),
            new StepExpectation(5, 8, epochSeconds("2024-01-09", "09:30:00"), 7.396433470507545, 115.39643347050755, 100.60356652949245, 115.39643347050755, 108.35802469135803, 115.39643347050755, 9.901365210007187, -9.901365210007187),
            new StepExpectation(6, 9, epochSeconds("2024-01-10", "09:30:00"), 7.93095564700503, 111.43095564700504, 95.56904435299496, 111.43095564700504, 95.56904435299496, 111.43095564700504, 11.430955647005035, -11.430955647005035),
            new StepExpectation(7, 10, epochSeconds("2024-01-11", "09:30:00"), 8.28730376467002, 107.78730376467001, 91.21269623532999, 107.78730376467001, 95.56904435299496, 107.78730376467001, 11.120931716154654, -11.120931716154654),
            new StepExpectation(8, 11, epochSeconds("2024-01-12", "09:30:00"), 8.191535843113346, 105.19153584311334, 88.80846415688666, 105.19153584311334, 95.56904435299496, 105.19153584311334, 10.727932466435098, -10.727932466435098),
            new StepExpectation(9, 12, epochSeconds("2024-01-13", "09:30:00"), 7.794357228742231, 103.29435722874223, 87.70564277125777, 103.29435722874223, 87.70564277125777, 103.29435722874223, 5.402405335451253, -5.402405335451253),
            new StepExpectation(10, 13, epochSeconds("2024-01-14", "09:30:00"), 7.1962381524948205, 107.19623815249481, 92.80376184750519, 103.29435722874223, 92.80376184750519, 103.29435722874223, 1.2689776752374788, -1.2689776752374788),
            new StepExpectation(11, 14, epochSeconds("2024-01-15", "09:30:00"), 6.797492101663214, 110.79749210166321, 97.20250789833679, 103.29435722874223, 97.20250789833679, 97.20250789833679, -8.299520850625669, 8.299520850625669)
    );

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void matchesJavaScriptParityFixtureAcrossAtrBandsSuperTrendAndGapPercents() throws Exception {
        ExecutionResult execution = executeStrategy("""
                {
                  "supertrendPeriod": 3,
                  "supertrendMultiplier": 1.0,
                  "buyThresholdPercent": 110.0,
                  "sellThresholdPercent": 100.0,
                  "debug": true
                }
                """);

        JsonNode result = objectMapper.readTree(execution.jsonResult());
        JsonNode trades = result.path("trades");
        JsonNode steps = result.path("debug").path("symbols").get(0).path("steps");

        assertThat(result.path("status").asText()).isEqualTo("ok");
        assertThat(result.path("supertrendPeriod").asInt()).isEqualTo(3);
        assertThat(result.path("supertrendMultiplier").asDouble()).isEqualTo(1.0);
        assertThat(result.path("buyThresholdPercent").asDouble()).isEqualTo(110.0);
        assertThat(result.path("sellThresholdPercent").asDouble()).isEqualTo(100.0);
        assertThat(result.path("tradeCount").asInt()).isZero();
        assertThat(trades).isEmpty();

        assertThat(result.path("debug").path("symbols")).hasSize(1);
        assertThat(result.path("debug").path("symbols").get(0).path("symbol").asText()).isEqualTo("AAPL");
        assertThat(result.path("debug").path("symbols").get(0).path("shiftOffset").asInt()).isEqualTo(3);
        assertThat(steps).hasSize(EXPECTED_STEPS.size());

        List<String> mismatches = new ArrayList<>();
        for (int i = 0; i < EXPECTED_STEPS.size(); i++) {
            JsonNode step = steps.get(i);
            StepExpectation expected = EXPECTED_STEPS.get(i);
            compareInt(step, "step", expected.step(), mismatches);
            compareInt(step, "sourceIndex", expected.sourceIndex(), mismatches);
            compareLong(step, "time", expected.time(), mismatches);
            compareDouble(step, "atr", expected.atr(), mismatches);
            compareDouble(step, "basicUpperBand", expected.basicUpperBand(), mismatches);
            compareDouble(step, "basicLowerBand", expected.basicLowerBand(), mismatches);
            compareDouble(step, "finalUpperBand", expected.finalUpperBand(), mismatches);
            compareDouble(step, "finalLowerBand", expected.finalLowerBand(), mismatches);
            compareDouble(step, "superTrend", expected.superTrend(), mismatches);
            compareDouble(step, "buyGapPercentFromClose", expected.buyGapPercentFromClose(), mismatches);
            compareDouble(step, "sellGapPercentFromClose", expected.sellGapPercentFromClose(), mismatches);
        }

        if (!mismatches.isEmpty()) {
            fail("Java SuperTrend output diverged from the JavaScript reference:\n"
                    + String.join(System.lineSeparator(), mismatches)
                    + "\nConsole output:\n"
                    + execution.consoleOutput());
        }

        assertThat(execution.consoleOutput())
                .contains("[supertrend-debug] symbol=AAPL step=0")
                .contains("buyGapPercentFromClose=4.994903160041")
                .doesNotContain("[supertrend-trade]");
    }

    @Test
    void emitsExpectedTradesWhenPercentGapCrossesConfiguredThresholds() throws Exception {
        ExecutionResult execution = executeStrategy("""
                {
                  "supertrendPeriod": 3,
                  "supertrendMultiplier": 1.0,
                  "buyThresholdPercent": 1.0,
                  "sellThresholdPercent": 1.0,
                  "debug": true
                }
                """);

        JsonNode result = objectMapper.readTree(execution.jsonResult());
        JsonNode trades = result.path("trades");

        assertThat(result.path("tradeCount").asInt()).isEqualTo(4);
        assertThat(trades).hasSize(4);
        assertThat(extractTradeTimes(trades)).containsExactly(
                epochSeconds("2024-01-05", "09:30:00"),
                epochSeconds("2024-01-07", "09:30:00"),
                epochSeconds("2024-01-09", "09:30:00"),
                epochSeconds("2024-01-15", "09:30:00")
        );
        assertThat(extractTradeAmounts(trades)).containsExactly(1, -1, 1, -1);
        assertThat(execution.consoleOutput())
                .contains("[supertrend-trade] symbol=AAPL step=1")
                .contains("[supertrend-trade] symbol=AAPL step=3")
                .contains("[supertrend-trade] symbol=AAPL step=5")
                .contains("[supertrend-trade] symbol=AAPL step=11");
    }

    @Test
    void keepsDebugSeriesEmptyUntilEnoughBarsExistForAtrWindow() throws Exception {
        ExecutionResult execution = executeStrategy("""
                {
                  "supertrendPeriod": 3,
                  "supertrendMultiplier": 1.0,
                  "buyThresholdPercent": 1.0,
                  "sellThresholdPercent": 1.0,
                  "debug": true
                }
                """, """
                ticker,period,tradeDate,tradeTime,open,high,low,close,volume,openInterest
                AAPL,1d,2024-01-01,09:30:00,98,100,95,98,1000,0
                AAPL,1d,2024-01-02,09:30:00,101,102,96,101,1000,0
                AAPL,1d,2024-01-03,09:30:00,104,105,99,104,1000,0
                """);

        JsonNode result = objectMapper.readTree(execution.jsonResult());
        assertThat(result.path("tradeCount").asInt()).isZero();
        assertThat(result.path("trades")).isEmpty();
        assertThat(result.path("debug").path("symbols")).hasSize(1);
        assertThat(result.path("debug").path("symbols").get(0).path("steps")).isEmpty();
        assertThat(execution.consoleOutput()).doesNotContain("[supertrend-debug]");
    }

    private List<Long> extractTradeTimes(JsonNode trades) {
        List<Long> times = new ArrayList<>();
        for (JsonNode trade : trades) {
            times.add(trade.path("time").asLong());
        }
        return times;
    }

    private List<Integer> extractTradeAmounts(JsonNode trades) {
        List<Integer> amounts = new ArrayList<>();
        for (JsonNode trade : trades) {
            amounts.add(trade.path("amount").asInt());
        }
        return amounts;
    }

    private ExecutionResult executeStrategy(String configJson) throws Exception {
        return executeStrategy(configJson, sampleStockData());
    }

    private ExecutionResult executeStrategy(String configJson, String stockDataCsv) throws Exception {
        Path workspace = Files.createTempDirectory("supertrend");
        Path sourceFile = workspace.resolve("StrategyMain.java");
        Path classesDir = workspace.resolve("classes");
        Path configFile = workspace.resolve("config.json");
        Path stockDataFile = workspace.resolve("stock-data.csv");

        Files.writeString(sourceFile, BuiltInStrategyCatalog.superTrend().code());
        Files.writeString(configFile, configJson);
        Files.writeString(stockDataFile, stockDataCsv);

        compileStrategy(sourceFile, classesDir);
        String output = runStrategy(workspace, classesDir);
        return new ExecutionResult(output, extractLastJsonLine(output));
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

    private String extractLastJsonLine(String output) {
        String[] lines = output.split("\\R");
        for (int i = lines.length - 1; i >= 0; i--) {
            String line = lines[i].trim();
            if (!line.isBlank() && line.startsWith("{")) {
                return line;
            }
        }
        throw new IllegalStateException("No JSON result found in strategy output:\n" + output);
    }

    private void compareInt(JsonNode step, String fieldName, int expected, List<String> mismatches) {
        int actual = step.path(fieldName).asInt();
        if (actual != expected) {
            mismatches.add(mismatchMessage(step, fieldName, Integer.toString(actual), Integer.toString(expected)));
        }
    }

    private void compareLong(JsonNode step, String fieldName, long expected, List<String> mismatches) {
        long actual = step.path(fieldName).asLong();
        if (actual != expected) {
            mismatches.add(mismatchMessage(step, fieldName, Long.toString(actual), Long.toString(expected)));
        }
    }

    private void compareDouble(JsonNode step, String fieldName, double expected, List<String> mismatches) {
        double actual = step.path(fieldName).asDouble();
        if (Double.doubleToLongBits(actual) != Double.doubleToLongBits(expected)) {
            mismatches.add(mismatchMessage(step, fieldName, Double.toString(actual), Double.toString(expected)));
        }
    }

    private String mismatchMessage(JsonNode step, String fieldName, String actual, String expected) {
        return "step=" + step.path("step").asInt()
                + ", sourceIndex=" + step.path("sourceIndex").asInt()
                + ", field=" + fieldName
                + ", java=" + actual
                + ", javascript=" + expected;
    }

    private static long epochSeconds(String date, String time) {
        return LocalDateTime.of(LocalDate.parse(date), LocalTime.parse(time)).toEpochSecond(ZoneOffset.UTC);
    }

    private String sampleStockData() {
        return """
                ticker,period,tradeDate,tradeTime,open,high,low,close,volume,openInterest
                AAPL,1d,2024-01-01,09:30:00,98,100,95,98,1000,0
                AAPL,1d,2024-01-02,09:30:00,101,102,96,101,1000,0
                AAPL,1d,2024-01-03,09:30:00,104,105,99,104,1000,0
                AAPL,1d,2024-01-04,09:30:00,101,108,100,101,1000,0
                AAPL,1d,2024-01-05,09:30:00,109,110,104,109,1000,0
                AAPL,1d,2024-01-06,09:30:00,113,114,108,113,1000,0
                AAPL,1d,2024-01-07,09:30:00,117,118,112,117,1000,0
                AAPL,1d,2024-01-08,09:30:00,111,116,109,111,1000,0
                AAPL,1d,2024-01-09,09:30:00,105,112,104,105,1000,0
                AAPL,1d,2024-01-10,09:30:00,100,108,99,100,1000,0
                AAPL,1d,2024-01-11,09:30:00,97,104,95,97,1000,0
                AAPL,1d,2024-01-12,09:30:00,95,101,93,95,1000,0
                AAPL,1d,2024-01-13,09:30:00,98,99,92,98,1000,0
                AAPL,1d,2024-01-14,09:30:00,102,103,97,102,1000,0
                AAPL,1d,2024-01-15,09:30:00,106,107,101,106,1000,0
                """;
    }

    private record ExecutionResult(String consoleOutput, String jsonResult) {
    }

    private record StepExpectation(
            int step,
            int sourceIndex,
            long time,
            double atr,
            double basicUpperBand,
            double basicLowerBand,
            double finalUpperBand,
            double finalLowerBand,
            double superTrend,
            double buyGapPercentFromClose,
            double sellGapPercentFromClose
    ) {
    }
}
