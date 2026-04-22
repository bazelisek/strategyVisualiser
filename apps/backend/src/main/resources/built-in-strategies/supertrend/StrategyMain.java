import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class StrategyMain {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        JsonNode config = loadConfig();
        int period = readPositiveInt(config, "supertrendPeriod");
        double multiplier = readPositiveDouble(config, "supertrendMultiplier");
        double buyThresholdPercent = readRequiredDouble(config, "buyThresholdPercent");
        double sellThresholdPercent = readRequiredDouble(config, "sellThresholdPercent");
        boolean debugEnabled = config.path("debug").asBoolean(false)
                || Boolean.parseBoolean(env("SUPERTREND_DEBUG", "false"));

        Map<String, List<BarPoint>> barsBySymbol = loadBars(resolveInputPath("STRATEGY_STOCK_DATA_FILE", "stock-data.csv"));
        List<Trade> trades = new ArrayList<>();
        ObjectNode debugNode = debugEnabled ? MAPPER.createObjectNode() : null;
        ArrayNode debugSymbols = debugEnabled ? debugNode.putArray("symbols") : null;

        for (Map.Entry<String, List<BarPoint>> entry : barsBySymbol.entrySet()) {
            StrategyRun run = runStrategy(
                    entry.getKey(),
                    entry.getValue(),
                    period,
                    multiplier,
                    buyThresholdPercent,
                    sellThresholdPercent,
                    debugEnabled
            );
            trades.addAll(run.trades());
            if (debugEnabled) {
                addSymbolDebug(debugSymbols, run);
            }
        }

        trades.sort(Comparator.comparingLong(Trade::time).thenComparing(Trade::symbol));

        ObjectNode result = MAPPER.createObjectNode();
        result.put("status", "ok");
        result.put("strategy", "SuperTrend");
        result.put("supertrendPeriod", period);
        result.put("supertrendMultiplier", multiplier);
        result.put("buyThresholdPercent", buyThresholdPercent);
        result.put("sellThresholdPercent", sellThresholdPercent);
        result.put("tradeCount", trades.size());

        ArrayNode tradesNode = result.putArray("trades");
        for (Trade trade : trades) {
            tradesNode.add(createTradeNode(trade));
        }

        if (debugEnabled) {
            result.set("debug", debugNode);
        }

        System.out.println(MAPPER.writeValueAsString(result));
    }

    private static StrategyRun runStrategy(
            String symbol,
            List<BarPoint> bars,
            int period,
            double multiplier,
            double buyThresholdPercent,
            double sellThresholdPercent,
            boolean debugEnabled
    ) {
        List<StepDebug> steps = computeSuperTrendSteps(symbol, bars, period, multiplier, debugEnabled);
        List<Trade> trades = new ArrayList<>();
        boolean inPosition = false;

        for (StepDebug step : steps) {
            double superTrend = step.superTrend();
            double buyGapPercent = step.buyGapPercentFromClose();
            double sellGapPercent = step.sellGapPercentFromClose();

            if (!inPosition && superTrend != 0D && buyGapPercent > buyThresholdPercent) {
                trades.add(new Trade(symbol, step.time(), 1));
                if (debugEnabled) {
                    logTrade(symbol, step, 1, buyThresholdPercent, sellThresholdPercent);
                }
                inPosition = true;
            } else if (inPosition && superTrend != 0D && sellGapPercent > sellThresholdPercent) {
                trades.add(new Trade(symbol, step.time(), -1));
                if (debugEnabled) {
                    logTrade(symbol, step, -1, buyThresholdPercent, sellThresholdPercent);
                }
                inPosition = false;
            }
        }

        return new StrategyRun(symbol, period, trades, steps);
    }

    private static List<StepDebug> computeSuperTrendSteps(
            String symbol,
            List<BarPoint> bars,
            int period,
            double multiplier,
            boolean debugEnabled
    ) {
        int barCount = bars.size();
        if (barCount <= period) {
            return List.of();
        }

        double[] highs = new double[barCount];
        double[] lows = new double[barCount];
        double[] closes = new double[barCount];

        for (int i = 0; i < barCount; i++) {
            BarPoint bar = bars.get(i);
            highs[i] = bar.high();
            lows[i] = bar.low();
            closes[i] = bar.close();
        }

        double[] atr = calculateAtr(highs, lows, closes, period);
        int shiftedLength = barCount - period;
        double[] basicUpperBand = new double[shiftedLength];
        double[] basicLowerBand = new double[shiftedLength];

        for (int i = 0; i < shiftedLength; i++) {
            int sourceIndex = i + period;
            double hl2 = (highs[sourceIndex] + lows[sourceIndex]) / 2D;
            basicUpperBand[i] = hl2 + multiplier * atr[i];
            basicLowerBand[i] = hl2 - multiplier * atr[i];
        }

        double[] finalUpperBand = new double[shiftedLength];
        double[] finalLowerBand = new double[shiftedLength];
        double previousFinalUpperBand = 0D;
        double previousFinalLowerBand = 0D;

        for (int i = 0; i < shiftedLength; i++) {
            int sourceIndex = i + period;

            if (basicUpperBand[i] < previousFinalUpperBand
                    || (i > 0 && closes[sourceIndex - 1] > previousFinalUpperBand)) {
                finalUpperBand[i] = basicUpperBand[i];
            } else {
                finalUpperBand[i] = previousFinalUpperBand;
            }

            if (basicLowerBand[i] > previousFinalLowerBand
                    || (i > 0 && closes[sourceIndex - 1] < previousFinalLowerBand)) {
                finalLowerBand[i] = basicLowerBand[i];
            } else {
                finalLowerBand[i] = previousFinalLowerBand;
            }

            previousFinalUpperBand = finalUpperBand[i];
            previousFinalLowerBand = finalLowerBand[i];
        }

        List<StepDebug> steps = new ArrayList<>(shiftedLength);
        double previousSuperTrend = 0D;

        for (int i = 0; i < shiftedLength; i++) {
            int sourceIndex = i + period;
            double nowSuperTrend = 0D;

            if (i > 0 && previousSuperTrend == finalUpperBand[i - 1]
                    && closes[sourceIndex] <= finalUpperBand[i]) {
                nowSuperTrend = finalUpperBand[i];
            } else if (i > 0 && previousSuperTrend == finalUpperBand[i - 1]
                    && closes[sourceIndex] > finalUpperBand[i]) {
                nowSuperTrend = finalLowerBand[i];
            } else if (i > 0 && previousSuperTrend == finalLowerBand[i - 1]
                    && closes[sourceIndex] >= finalLowerBand[i]) {
                nowSuperTrend = finalLowerBand[i];
            } else if (i > 0 && previousSuperTrend == finalLowerBand[i - 1]
                    && closes[sourceIndex] < finalLowerBand[i]) {
                nowSuperTrend = finalUpperBand[i];
            }

            StepDebug step = new StepDebug(
                    i,
                    sourceIndex,
                    bars.get(sourceIndex).time(),
                    highs[sourceIndex],
                    lows[sourceIndex],
                    closes[sourceIndex],
                    atr[i],
                    basicUpperBand[i],
                    basicLowerBand[i],
                    finalUpperBand[i],
                    finalLowerBand[i],
                    nowSuperTrend,
                    calculateGapPercent(nowSuperTrend, closes[sourceIndex], closes[sourceIndex]),
                    calculateGapPercent(closes[sourceIndex], nowSuperTrend, closes[sourceIndex])
            );
            steps.add(step);

            if (debugEnabled) {
                logStep(symbol, step);
            }

            previousSuperTrend = nowSuperTrend;
        }

        return steps;
    }

    private static double[] calculateAtr(double[] highs, double[] lows, double[] closes, int period) {
        if (highs.length <= period) {
            return new double[0];
        }

        int trueRangeLength = highs.length - 1;
        double[] trueRanges = new double[trueRangeLength];

        for (int i = 1; i < highs.length; i++) {
            double highLow = highs[i] - lows[i];
            double highPreviousClose = Math.abs(highs[i] - closes[i - 1]);
            double lowPreviousClose = Math.abs(lows[i] - closes[i - 1]);
            trueRanges[i - 1] = Math.max(highLow, Math.max(highPreviousClose, lowPreviousClose));
        }

        int atrLength = trueRangeLength - period + 1;
        double[] atr = new double[atrLength];
        double sum = 0D;
        for (int i = 0; i < period; i++) {
            sum += trueRanges[i];
        }
        atr[0] = sum / period;

        double exponent = 1D / period;
        for (int i = period; i < trueRangeLength; i++) {
            double previous = atr[i - period];
            atr[i - period + 1] = ((trueRanges[i] - previous) * exponent) + previous;
        }

        return atr;
    }

    private static double calculateGapPercent(double currentValue, double referenceValue, double denominator) {
        if (denominator == 0D) {
            return 0D;
        }
        return ((currentValue - referenceValue) / denominator) * 100D;
    }

    private static void addSymbolDebug(ArrayNode debugSymbols, StrategyRun run) {
        ObjectNode symbolNode = debugSymbols.addObject();
        symbolNode.put("symbol", run.symbol());
        symbolNode.put("shiftOffset", run.shiftOffset());

        ArrayNode stepsNode = symbolNode.putArray("steps");
        for (StepDebug step : run.steps()) {
            ObjectNode stepNode = stepsNode.addObject();
            stepNode.put("step", step.step());
            stepNode.put("sourceIndex", step.sourceIndex());
            stepNode.put("time", step.time());
            stepNode.put("high", step.high());
            stepNode.put("low", step.low());
            stepNode.put("close", step.close());
            stepNode.put("atr", step.atr());
            stepNode.put("basicUpperBand", step.basicUpperBand());
            stepNode.put("basicLowerBand", step.basicLowerBand());
            stepNode.put("finalUpperBand", step.finalUpperBand());
            stepNode.put("finalLowerBand", step.finalLowerBand());
            stepNode.put("superTrend", step.superTrend());
            stepNode.put("buyGapPercentFromClose", step.buyGapPercentFromClose());
            stepNode.put("sellGapPercentFromClose", step.sellGapPercentFromClose());
        }
    }

    private static void logStep(String symbol, StepDebug step) {
        System.out.printf(
                Locale.ROOT,
                "[supertrend-debug] symbol=%s step=%d sourceIndex=%d time=%d atr=%.12f basicUpperBand=%.12f basicLowerBand=%.12f finalUpperBand=%.12f finalLowerBand=%.12f superTrend=%.12f buyGapPercentFromClose=%.12f sellGapPercentFromClose=%.12f%n",
                symbol,
                step.step(),
                step.sourceIndex(),
                step.time(),
                step.atr(),
                step.basicUpperBand(),
                step.basicLowerBand(),
                step.finalUpperBand(),
                step.finalLowerBand(),
                step.superTrend(),
                step.buyGapPercentFromClose(),
                step.sellGapPercentFromClose()
        );
    }

    private static void logTrade(
            String symbol,
            StepDebug step,
            int amount,
            double buyThresholdPercent,
            double sellThresholdPercent
    ) {
        System.out.printf(
                Locale.ROOT,
                "[supertrend-trade] symbol=%s step=%d time=%d amount=%d superTrend=%.12f buyGapPercentFromClose=%.12f sellGapPercentFromClose=%.12f buyThresholdPercent=%.12f sellThresholdPercent=%.12f%n",
                symbol,
                step.step(),
                step.time(),
                amount,
                step.superTrend(),
                step.buyGapPercentFromClose(),
                step.sellGapPercentFromClose(),
                buyThresholdPercent,
                sellThresholdPercent
        );
    }

    private static JsonNode loadConfig() throws IOException {
        Path configPath = resolveInputPath("STRATEGY_CONFIG_FILE", "config.json");
        return MAPPER.readTree(Files.readString(configPath));
    }

    private static Path resolveInputPath(String envKey, String fallback) {
        String configuredPath = System.getenv(envKey);
        if (configuredPath == null || configuredPath.isBlank()) {
            return Path.of(fallback);
        }
        return Path.of(configuredPath);
    }

    private static String env(String key, String fallback) {
        String configuredValue = System.getenv(key);
        return configuredValue == null || configuredValue.isBlank() ? fallback : configuredValue;
    }

    private static int readPositiveInt(JsonNode config, String fieldName) {
        JsonNode node = config.get(fieldName);
        if (node == null || !node.canConvertToInt()) {
            throw new IllegalArgumentException("Missing numeric config field: " + fieldName);
        }

        int value = node.asInt();
        if (value <= 0) {
            throw new IllegalArgumentException(fieldName + " must be greater than zero.");
        }
        return value;
    }

    private static double readPositiveDouble(JsonNode config, String fieldName) {
        double value = readRequiredDouble(config, fieldName);
        if (value <= 0D) {
            throw new IllegalArgumentException(fieldName + " must be greater than zero.");
        }
        return value;
    }

    private static double readRequiredDouble(JsonNode config, String fieldName) {
        JsonNode node = config.get(fieldName);
        if (node == null || !node.isNumber()) {
            throw new IllegalArgumentException("Missing numeric config field: " + fieldName);
        }
        return node.asDouble();
    }

    private static Map<String, List<BarPoint>> loadBars(Path csvPath) throws IOException {
        Map<String, List<BarPoint>> barsBySymbol = new LinkedHashMap<>();

        try (BufferedReader reader = Files.newBufferedReader(csvPath)) {
            String header = reader.readLine();
            if (header == null) {
                return barsBySymbol;
            }

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }

                String[] columns = line.split(",", -1);
                if (columns.length < 8) {
                    continue;
                }

                String symbol = columns[0].trim();
                if (symbol.isEmpty()) {
                    continue;
                }

                LocalDate tradeDate = LocalDate.parse(columns[2].trim());
                String tradeTimeColumn = columns[3].trim();
                LocalTime tradeTime = tradeTimeColumn.isEmpty()
                        ? LocalTime.MIDNIGHT
                        : LocalTime.parse(tradeTimeColumn);

                long epochSeconds = LocalDateTime.of(tradeDate, tradeTime).toEpochSecond(ZoneOffset.UTC);
                double high = Double.parseDouble(columns[5].trim());
                double low = Double.parseDouble(columns[6].trim());
                double close = Double.parseDouble(columns[7].trim());

                barsBySymbol.computeIfAbsent(symbol, ignored -> new ArrayList<>())
                        .add(new BarPoint(symbol, epochSeconds, high, low, close));
            }
        }

        barsBySymbol.values().forEach(bars -> bars.sort(Comparator.comparingLong(BarPoint::time)));
        return barsBySymbol;
    }

    private static ObjectNode createTradeNode(Trade trade) {
        ObjectNode tradeNode = MAPPER.createObjectNode();
        tradeNode.put("symbol", trade.symbol());
        tradeNode.put("time", trade.time());
        tradeNode.put("amount", trade.amount());
        return tradeNode;
    }

    private record BarPoint(String symbol, long time, double high, double low, double close) {
    }

    private record Trade(String symbol, long time, int amount) {
    }

    private record StepDebug(
            int step,
            int sourceIndex,
            long time,
            double high,
            double low,
            double close,
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

    private record StrategyRun(String symbol, int shiftOffset, List<Trade> trades, List<StepDebug> steps) {
    }
}
