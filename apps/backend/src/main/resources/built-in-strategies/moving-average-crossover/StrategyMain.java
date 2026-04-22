import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.ta4j.core.BarSeries;
import org.ta4j.core.BaseBarSeriesBuilder;
import org.ta4j.core.Rule;
import org.ta4j.core.indicators.averages.SMAIndicator;
import org.ta4j.core.indicators.helpers.ClosePriceIndicator;
import org.ta4j.core.indicators.helpers.PreviousValueIndicator;
import org.ta4j.core.rules.CrossedDownIndicatorRule;
import org.ta4j.core.rules.CrossedUpIndicatorRule;
import org.ta4j.core.rules.OverIndicatorRule;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class StrategyMain {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        JsonNode config = loadConfig();
        int maRange1 = readPositiveInt(config, "maRange1");
        int maRange2 = readPositiveInt(config, "maRange2");

        Map<String, List<BarPoint>> barsBySymbol = loadBars(
            resolveInputPath("STRATEGY_STOCK_DATA_FILE", "stock-data.csv"));

        ObjectNode result = MAPPER.createObjectNode();
        ArrayNode trades = result.putArray("trades");

        for (Map.Entry<String, List<BarPoint>> entry : barsBySymbol.entrySet()) {
            emitTrades(entry.getKey(), entry.getValue(), maRange1, maRange2, trades);
        }

        result.put("status", "ok");
        result.put("strategy", "Moving Average Crossover (ta4j)");
        result.put("maRange1", maRange1);
        result.put("maRange2", maRange2);
        result.put("tradeCount", trades.size());

        System.out.println(MAPPER.writeValueAsString(result));
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

                LocalDateTime dateTime = LocalDateTime.of(tradeDate, tradeTime);
                long epochSeconds = dateTime.toEpochSecond(ZoneOffset.UTC);
                double open = Double.parseDouble(columns[4].trim());
                double high = Double.parseDouble(columns[5].trim());
                double low = Double.parseDouble(columns[6].trim());
                double close = Double.parseDouble(columns[7].trim());
                double volume = columns.length > 8 && !columns[8].trim().isEmpty()
                        ? Double.parseDouble(columns[8].trim())
                        : 0D;

                barsBySymbol.computeIfAbsent(symbol, ignored -> new ArrayList<>())
                        .add(new BarPoint(symbol, epochSeconds, open, high, low, close, volume));
            }
        }

        barsBySymbol.values().forEach(bars -> bars.sort(Comparator.comparingLong(BarPoint::time)));
        return barsBySymbol;
    }

    private static void emitTrades(
            String symbol,
            List<BarPoint> bars,
            int maRange1,
            int maRange2,
            ArrayNode trades) {
        BarSeries series = new BaseBarSeriesBuilder().withName(symbol).build();
        for (BarPoint bar : bars) {
            series.addBar(series.barBuilder()
                    .timePeriod(Duration.ofDays(1))
                    .endTime(java.time.Instant.ofEpochSecond(bar.time()))
                    .openPrice(bar.open())
                    .highPrice(bar.high())
                    .lowPrice(bar.low())
                    .closePrice(bar.close())
                    .volume(bar.volume())
                    .build());
        }

        ClosePriceIndicator closePrice = new ClosePriceIndicator(series);
        int shortPeriod = Math.min(maRange1, maRange2);
        int longPeriod = Math.max(maRange1, maRange2);

        SMAIndicator shortMa = new SMAIndicator(closePrice, shortPeriod);
        SMAIndicator longMa = new SMAIndicator(closePrice, longPeriod);
        int slopeLookback = 3;

        PreviousValueIndicator longMaPrev = new PreviousValueIndicator(longMa, slopeLookback);
        Rule longMaRising = new OverIndicatorRule(longMa, longMaPrev);
        Rule crossover = new CrossedUpIndicatorRule(shortMa, longMa);
        Rule entryRule = crossover.and(longMaRising);

        Rule longMaFallingOrFlat = new OverIndicatorRule(longMa, longMaPrev).negation();

        Rule exitRule = new CrossedDownIndicatorRule(shortMa, longMa)
                .or(longMaFallingOrFlat);

        Set<Long> emittedTimes = new HashSet<>();
        boolean inPosition = false;
        int startIndex = Math.max(shortPeriod - 1, longPeriod - 1 + slopeLookback);

        for (int index = startIndex; index <= series.getEndIndex(); index++) {
            long time = bars.get(index).time();

            if (!inPosition && entryRule.isSatisfied(index) && emittedTimes.add(time)) {
                trades.add(createTrade(symbol, time, 1));
                inPosition = true;
                continue;
            }

            if (inPosition && exitRule.isSatisfied(index) && emittedTimes.add(time)) {
                trades.add(createTrade(symbol, time, -1));
                inPosition = false;
            }
        }
    }

    private static ObjectNode createTrade(String symbol, long time, int amount) {
        ObjectNode trade = MAPPER.createObjectNode();
        trade.put("symbol", symbol);
        trade.put("time", time);
        trade.put("amount", amount);
        return trade;
    }

    private record BarPoint(String symbol, long time, double open, double high, double low, double close,
            double volume) {
    }
}
