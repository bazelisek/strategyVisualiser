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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class StrategyMain {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final double PORTFOLIO_RISK_FRACTION = 0.02D;
    private static final double MIN_POSITION_SIZE = 1e-6D;

    public static void main(String[] args) throws Exception {
        JsonNode config = loadConfig();
        int fastEmaPeriod = readPositiveInt(config, "fastEmaPeriod");
        int slowEmaPeriod = readPositiveInt(config, "slowEmaPeriod");
        int adxPeriod = readPositiveInt(config, "adxPeriod");
        double adxThreshold = readPositiveDouble(config, "adxThreshold");
        int atrPeriod = readPositiveInt(config, "atrPeriod");
        double atrMultiplier = readPositiveDouble(config, "atrMultiplier");
        double availableMoney = readPositiveDouble(config, "availableMoney");

        if (fastEmaPeriod >= slowEmaPeriod) {
            throw new IllegalArgumentException("fastEmaPeriod must be smaller than slowEmaPeriod.");
        }

        Map<String, List<BarPoint>> barsBySymbol = loadBars(resolveInputPath("STRATEGY_STOCK_DATA_FILE", "stock-data.csv"));
        PortfolioSimulation simulation = simulatePortfolio(
                barsBySymbol,
                fastEmaPeriod,
                slowEmaPeriod,
                adxPeriod,
                adxThreshold,
                atrPeriod,
                atrMultiplier,
                availableMoney
        );

        ObjectNode result = MAPPER.createObjectNode();
        result.put("status", "ok");
        result.put("strategy", "EMA ADX Trend");
        result.put("fastEmaPeriod", fastEmaPeriod);
        result.put("slowEmaPeriod", slowEmaPeriod);
        result.put("adxPeriod", adxPeriod);
        result.put("adxThreshold", adxThreshold);
        result.put("atrPeriod", atrPeriod);
        result.put("atrMultiplier", atrMultiplier);
        result.put("availableMoney", availableMoney);
        result.put("endingCash", simulation.cash());
        result.put("endingEquity", simulation.cash() + simulation.openPositionValue());
        result.put("tradeCount", simulation.trades().size());

        ArrayNode tradesNode = result.putArray("trades");
        for (Trade trade : simulation.trades()) {
            tradesNode.add(createTradeNode(trade));
        }

        System.out.println(MAPPER.writeValueAsString(result));
    }

    private static PortfolioSimulation simulatePortfolio(
            Map<String, List<BarPoint>> barsBySymbol,
            int fastEmaPeriod,
            int slowEmaPeriod,
            int adxPeriod,
            double adxThreshold,
            int atrPeriod,
            double atrMultiplier,
            double startingCash
    ) {
        List<SymbolState> states = buildSymbolStates(
                barsBySymbol,
                fastEmaPeriod,
                slowEmaPeriod,
                adxPeriod,
                adxThreshold,
                atrPeriod
        );
        List<Trade> trades = new ArrayList<>();
        Map<String, Position> openPositions = new LinkedHashMap<>();
        List<Long> timeline = buildTimeline(states);
        double cash = startingCash;

        for (long time : timeline) {
            List<ExitSignal> exits = new ArrayList<>();
            List<EntrySignal> entries = new ArrayList<>();

            for (SymbolState state : states) {
                Integer index = state.indexByTime().get(time);
                if (index == null || index <= state.startIndex()) {
                    continue;
                }

                int signalIndex = index - 1;
                double prevClose = state.closeIndicator().getValue(signalIndex).doubleValue();
                double openPrice = state.bars().get(index).open();
                double fastValue = state.fastIndicator().getValue(signalIndex).doubleValue();
                double slowValue = state.slowIndicator().getValue(signalIndex).doubleValue();
                double adxValue = state.adxIndicator().getValue(signalIndex).doubleValue();
                double atrValue = state.atrIndicator().getValue(signalIndex).doubleValue();
                double fadeThreshold = state.adxThreshold() * 0.75D;
                Position currentPosition = openPositions.get(state.symbol());

                if (currentPosition != null) {
                    currentPosition.highestClose = Math.max(currentPosition.highestClose, prevClose);
                    double trailingStop = currentPosition.highestClose - (atrValue * atrMultiplier);

                    if (prevClose < fastValue || prevClose <= trailingStop || adxValue < fadeThreshold) {
                        exits.add(new ExitSignal(state, time, openPrice));
                    }
                    continue;
                }

                if (prevClose > fastValue && fastValue > slowValue && adxValue >= adxThreshold) {
                    entries.add(new EntrySignal(state, time, openPrice, prevClose, atrValue, adxValue));
                }
            }

            exits.sort(Comparator.comparing(exit -> exit.state().symbol()));
            for (ExitSignal exit : exits) {
                Position position = openPositions.remove(exit.state().symbol());
                if (position == null || position.shares <= MIN_POSITION_SIZE) {
                    continue;
                }

                cash += position.shares * exit.executionPrice();
                trades.add(new Trade(exit.state().symbol(), exit.time(), -position.shares));
            }

            entries.sort(Comparator
                    .comparingDouble(EntrySignal::adxValue).reversed()
                    .thenComparing(entry -> entry.state().symbol()));

            for (int i = 0; i < entries.size(); i++) {
                EntrySignal entry = entries.get(i);
                if (cash <= 0D) {
                    break;
                }

                int remainingEntries = entries.size() - i;
                double atrRisk = entry.atrValue() * atrMultiplier;
                if (atrRisk <= 0D || entry.executionPrice() <= 0D) {
                    continue;
                }

                double equity = cash + markOpenPositions(openPositions, entry.time(), states);
                double riskBudget = Math.max(equity * PORTFOLIO_RISK_FRACTION, 0D);
                double equalCashBudget = cash / remainingEntries;
                double sharesByRisk = riskBudget / atrRisk;
                double sharesByCash = equalCashBudget / entry.executionPrice();
                double shares = Math.min(sharesByRisk, sharesByCash);

                if (shares <= MIN_POSITION_SIZE) {
                    continue;
                }

                double tradeCost = shares * entry.executionPrice();
                if (tradeCost > cash) {
                    shares = cash / entry.executionPrice();
                    tradeCost = shares * entry.executionPrice();
                }

                if (shares <= MIN_POSITION_SIZE || tradeCost <= 0D) {
                    continue;
                }

                cash -= tradeCost;
                openPositions.put(entry.state().symbol(), new Position(shares, entry.closePrice()));
                trades.add(new Trade(entry.state().symbol(), entry.time(), shares));
            }
        }

        Set<String> closedSymbols = new LinkedHashSet<>();
        for (SymbolState state : states) {
            Position position = openPositions.remove(state.symbol());
            if (position == null || position.shares <= MIN_POSITION_SIZE || !closedSymbols.add(state.symbol())) {
                continue;
            }

            BarPoint lastBar = state.bars().get(state.bars().size() - 1);
            cash += position.shares * lastBar.open();
            trades.add(new Trade(state.symbol(), lastBar.time(), -position.shares));
        }

        trades.sort(Comparator.comparingLong(Trade::time)
                .thenComparing(Trade::symbol)
                .thenComparing(trade -> trade.amount() < 0)); // Buy (positive) before Sell (negative)
        return new PortfolioSimulation(trades, cash, 0D);
    }

    private static double markOpenPositions(
            Map<String, Position> openPositions,
            long time,
            List<SymbolState> states
    ) {
        if (openPositions.isEmpty()) {
            return 0D;
        }

        double value = 0D;
        for (SymbolState state : states) {
            Position position = openPositions.get(state.symbol());
            if (position == null || position.shares <= MIN_POSITION_SIZE) {
                continue;
            }

            BarPoint latestBar = latestBarAtOrBefore(state.bars(), time);
            if (latestBar == null) {
                continue;
            }
            value += position.shares * latestBar.open();
        }
        return value;
    }

    private static BarPoint latestBarAtOrBefore(List<BarPoint> bars, long time) {
        BarPoint latest = null;
        for (BarPoint bar : bars) {
            if (bar.time() > time) {
                break;
            }
            latest = bar;
        }
        return latest == null && !bars.isEmpty() ? bars.get(0) : latest;
    }

    private static List<Long> buildTimeline(List<SymbolState> states) {
        Set<Long> timeline = new LinkedHashSet<>();
        for (SymbolState state : states) {
            for (BarPoint bar : state.bars()) {
                timeline.add(bar.time());
            }
        }
        return timeline.stream().sorted().toList();
    }

    private static List<SymbolState> buildSymbolStates(
            Map<String, List<BarPoint>> barsBySymbol,
            int fastEmaPeriod,
            int slowEmaPeriod,
            int adxPeriod,
            double adxThreshold,
            int atrPeriod
    ) {
        List<SymbolState> states = new ArrayList<>();

        for (Map.Entry<String, List<BarPoint>> entry : barsBySymbol.entrySet()) {
            List<BarPoint> bars = entry.getValue();
            int minimumBars = Math.max(slowEmaPeriod, Math.max(adxPeriod, atrPeriod)) + 2;
            if (bars.size() < minimumBars) {
                continue;
            }

            BarSeries series = buildSeries(entry.getKey(), bars);
            ClosePriceIndicator close = new ClosePriceIndicator(series);
            EMAIndicator fast = new EMAIndicator(close, fastEmaPeriod);
            EMAIndicator slow = new EMAIndicator(close, slowEmaPeriod);
            ADXIndicator adx = new ADXIndicator(series, adxPeriod);
            ATRIndicator atr = new ATRIndicator(series, atrPeriod);
            int startIndex = Math.max(slowEmaPeriod, Math.max(adxPeriod, atrPeriod));

            Map<Long, Integer> indexByTime = new LinkedHashMap<>();
            for (int i = 0; i < bars.size(); i++) {
                indexByTime.put(bars.get(i).time(), i);
            }

            states.add(new SymbolState(
                    entry.getKey(),
                    bars,
                    close,
                    fast,
                    slow,
                    adx,
                    atr,
                    startIndex,
                    adxThreshold,
                    indexByTime
            ));
        }

        states.sort(Comparator.comparing(SymbolState::symbol));
        return states;
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

    private record PortfolioSimulation(List<Trade> trades, double cash, double openPositionValue) {
    }

    private record EntrySignal(
            SymbolState state,
            long time,
            double executionPrice,
            double closePrice,
            double atrValue,
            double adxValue
    ) {
    }

    private record ExitSignal(SymbolState state, long time, double executionPrice) {
    }

    private static final class Position {
        private final double shares;
        private double highestClose;

        private Position(double shares, double highestClose) {
            this.shares = shares;
            this.highestClose = highestClose;
        }
    }

    private record SymbolState(
            String symbol,
            List<BarPoint> bars,
            ClosePriceIndicator closeIndicator,
            EMAIndicator fastIndicator,
            EMAIndicator slowIndicator,
            ADXIndicator adxIndicator,
            ATRIndicator atrIndicator,
            int startIndex,
            double adxThreshold,
            Map<Long, Integer> indexByTime
    ) {
    }

    private record Trade(String symbol, long time, double amount) {
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
