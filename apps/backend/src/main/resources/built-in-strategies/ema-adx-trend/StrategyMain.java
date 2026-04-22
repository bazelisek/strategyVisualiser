import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.ta4j.core.BarSeries;
import org.ta4j.core.BaseBarSeriesBuilder;
import org.ta4j.core.indicators.ATRIndicator;
import org.ta4j.core.indicators.adx.ADXIndicator;
import org.ta4j.core.indicators.averages.EMAIndicator;
import org.ta4j.core.indicators.helpers.ClosePriceIndicator;

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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class StrategyMain {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        JsonNode config = loadConfig();
        int fastEmaPeriod = readPositiveInt(config, "fastEmaPeriod");
        int slowEmaPeriod = readPositiveInt(config, "slowEmaPeriod");
        int adxPeriod = readPositiveInt(config, "adxPeriod");
        double adxThreshold = readPositiveDouble(config, "adxThreshold");
        int atrPeriod = readPositiveInt(config, "atrPeriod");
        double atrMultiplier = readPositiveDouble(config, "atrMultiplier");

        if (fastEmaPeriod >= slowEmaPeriod) {
            throw new IllegalArgumentException("fastEmaPeriod must be smaller than slowEmaPeriod.");
        }

        Map<String, List<BarPoint>> barsBySymbol = loadBars(resolveInputPath("STRATEGY_STOCK_DATA_FILE", "stock-data.csv"));
        List<Trade> trades = new ArrayList<>();

        for (Map.Entry<String, List<BarPoint>> entry : barsBySymbol.entrySet()) {
            emitTrades(
                    entry.getKey(),
                    entry.getValue(),
                    fastEmaPeriod,
                    slowEmaPeriod,
                    adxPeriod,
                    adxThreshold,
                    atrPeriod,
                    atrMultiplier,
                    trades
            );
        }

        trades.sort(Comparator.comparingLong(Trade::time).thenComparing(Trade::symbol));

        ObjectNode result = MAPPER.createObjectNode();
        result.put("status", "ok");
        result.put("strategy", "EMA ADX Trend");
        result.put("fastEmaPeriod", fastEmaPeriod);
        result.put("slowEmaPeriod", slowEmaPeriod);
        result.put("adxPeriod", adxPeriod);
        result.put("adxThreshold", adxThreshold);
        result.put("atrPeriod", atrPeriod);
        result.put("atrMultiplier", atrMultiplier);
        result.put("tradeCount", trades.size());

        ArrayNode tradesNode = result.putArray("trades");
        for (Trade trade : trades) {
            tradesNode.add(createTradeNode(trade));
        }

        System.out.println(MAPPER.writeValueAsString(result));
    }

    private static void emitTrades(
            String symbol,
            List<BarPoint> bars,
            int fastEmaPeriod,
            int slowEmaPeriod,
            int adxPeriod,
            double adxThreshold,
            int atrPeriod,
            double atrMultiplier,
            List<Trade> trades
    ) {
        int minimumBars = Math.max(slowEmaPeriod, Math.max(adxPeriod, atrPeriod)) + 2;
        if (bars.size() < minimumBars) {
            return;
        }

        BarSeries series = buildSeries(symbol, bars);
        ClosePriceIndicator close = new ClosePriceIndicator(series);
        EMAIndicator fast = new EMAIndicator(close, fastEmaPeriod);
        EMAIndicator slow = new EMAIndicator(close, slowEmaPeriod);
        ADXIndicator adx = new ADXIndicator(series, adxPeriod);
        ATRIndicator atr = new ATRIndicator(series, atrPeriod);
        int startIndex = Math.max(slowEmaPeriod, Math.max(adxPeriod, atrPeriod));
        double fadeThreshold = adxThreshold * 0.75D;

        boolean inPosition = false;
        double highestClose = 0D;

        for (int index = startIndex; index <= series.getEndIndex(); index++) {
            double closePrice = close.getValue(index).doubleValue();
            double fastValue = fast.getValue(index).doubleValue();
            double slowValue = slow.getValue(index).doubleValue();
            double adxValue = adx.getValue(index).doubleValue();
            double atrValue = atr.getValue(index).doubleValue();
            long time = bars.get(index).time();

            if (!inPosition && closePrice > fastValue && fastValue > slowValue && adxValue >= adxThreshold) {
                trades.add(new Trade(symbol, time, 1));
                highestClose = closePrice;
                inPosition = true;
                continue;
            }

            if (inPosition) {
                highestClose = Math.max(highestClose, closePrice);
                double trailingStop = highestClose - (atrValue * atrMultiplier);

                if (closePrice < fastValue || closePrice <= trailingStop || adxValue < fadeThreshold) {
                    trades.add(new Trade(symbol, time, -1));
                    inPosition = false;
                }
            }
        }

        if (inPosition) {
            trades.add(new Trade(symbol, bars.get(bars.size() - 1).time(), -1));
        }
    }

    private static BarSeries buildSeries(String symbol, List<BarPoint> bars) {
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
        return series;
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

    private static double readPositiveDouble(JsonNode config, String fieldName) {
        JsonNode node = config.get(fieldName);
        if (node == null || !node.isNumber()) {
            throw new IllegalArgumentException("Missing numeric config field: " + fieldName);
        }

        double value = node.asDouble();
        if (value <= 0D) {
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

                long epochSeconds = LocalDateTime.of(tradeDate, tradeTime).toEpochSecond(ZoneOffset.UTC);
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

    private static ObjectNode createTradeNode(Trade trade) {
        ObjectNode tradeNode = MAPPER.createObjectNode();
        tradeNode.put("symbol", trade.symbol());
        tradeNode.put("time", trade.time());
        tradeNode.put("amount", trade.amount());
        return tradeNode;
    }

    private record Trade(String symbol, long time, int amount) {
    }

    private record BarPoint(
            String symbol,
            long time,
            double open,
            double high,
            double low,
            double close,
            double volume
    ) {
    }
}
