import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import org.ta4j.core.*;
import org.ta4j.core.num.DecimalNum;

import org.ta4j.core.indicators.helpers.ClosePriceIndicator;
import org.ta4j.core.indicators.averages.EMAIndicator;
import org.ta4j.core.indicators.averages.SMAIndicator;
import org.ta4j.core.indicators.adx.ADXIndicator;
import org.ta4j.core.indicators.ATRIndicator;
import org.ta4j.core.indicators.CCIIndicator;

import java.io.BufferedReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.*;
import java.util.*;

public class StrategyMain {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static void main(String[] args) throws Exception {

        Path cfgPath = Path.of(envOr("STRATEGY_CONFIG_FILE", "config.json"));
        Path csvPath = Path.of(envOr("STRATEGY_STOCK_DATA_FILE", "stock-data.csv"));

        JsonNode config = MAPPER.readTree(Files.readString(cfgPath));

        int emaFast = config.path("emaFast").asInt(20);
        int emaMid = config.path("emaMid").asInt(50);
        int emaSlow = config.path("emaSlow").asInt(100);
        int smaLong = config.path("smaLong").asInt(200);

        int slopeLookback = config.path("slopeLookback").asInt(15);

        int adxPeriod = config.path("adxPeriod").asInt(14);
        double adxThreshold = config.path("adxThreshold").asDouble(25);

        int cciPeriod = config.path("cciPeriod").asInt(20);
        double cciOversold = config.path("cciOversold").asDouble(-100);
        double cciOverbought = config.path("cciOverbought").asDouble(100);

        int atrPeriod = config.path("atrPeriod").asInt(14);
        double atrMultiplier = config.path("atrMultiplier").asDouble(2.0);

        double riskPercent = config.path("riskPercent").asDouble(1.0) / 100.0;
        double accountSize = config.path("accountSize").asDouble(10000);

        int minPositionSize = config.path("minPositionSize").asInt(1);
        int maxPositionSize = config.path("maxPositionSize").asInt(1000);

        boolean useTrailingStop = config.path("useTrailingStop").asBoolean(true);
        boolean useEmaExit = config.path("useEmaExit").asBoolean(true);
        boolean allowShorts = config.path("allowShorts").asBoolean(true);

        int cooldownBars = config.path("cooldownBars").asInt(5);
        int minHoldBars = config.path("minHoldBars").asInt(2);

        boolean debug = true;

        Map<String, List<Bar>> barsBySymbol = new HashMap<>();

        try (BufferedReader reader = Files.newBufferedReader(csvPath)) {
            reader.readLine();

            String line;
            while ((line = reader.readLine()) != null) {

                String[] p = line.split(",");

                String symbol = p[0];
                String date = p[2];
                String time = p[3].isEmpty() ? "00:00" : p[3];

                double open = parse(p[4]);
                double high = parse(p[5]);
                double low = parse(p[6]);
                double close = parse(p[7]);
                double volume = parse(p[8]);

                LocalDateTime ldt = LocalDateTime.parse(date + "T" + time);
                Instant instant = ldt.toInstant(ZoneOffset.UTC);

                Bar bar = new BaseBar(
                        Duration.ofDays(1),
                        instant,
                        DecimalNum.valueOf(open),
                        DecimalNum.valueOf(high),
                        DecimalNum.valueOf(low),
                        DecimalNum.valueOf(close),
                        DecimalNum.valueOf(volume),
                        DecimalNum.valueOf(volume),
                        0L
                );

                barsBySymbol.computeIfAbsent(symbol, k -> new ArrayList<>()).add(bar);
            }
        }

        List<ObjectNode> tradesOut = new ArrayList<>();

        for (String symbol : barsBySymbol.keySet()) {

            List<Bar> bars = barsBySymbol.get(symbol);
            if (bars.size() < smaLong + slopeLookback + 5) continue;

            BarSeries series = new BaseBarSeriesBuilder().withName(symbol).build();
            bars.forEach(series::addBar);

            ClosePriceIndicator close = new ClosePriceIndicator(series);

            EMAIndicator emaFastInd = new EMAIndicator(close, emaFast);
            EMAIndicator emaMidInd = new EMAIndicator(close, emaMid);
            EMAIndicator emaSlowInd = new EMAIndicator(close, emaSlow);
            SMAIndicator smaLongInd = new SMAIndicator(close, smaLong);

            ADXIndicator adx = new ADXIndicator(series, adxPeriod);
            CCIIndicator cci = new CCIIndicator(series, cciPeriod);
            ATRIndicator atr = new ATRIndicator(series, atrPeriod);

            boolean inPosition = false;
            boolean isLong = false;
            int positionSize = 0;
            int entryIndex = -1;
            int cooldown = 0;
            double trailingStop = 0;

            for (int i = slopeLookback + 1; i < series.getBarCount(); i++) {

                if (cooldown > 0) cooldown--;

                double price = close.getValue(i).doubleValue();
                double atrVal = atr.getValue(i).doubleValue();
                if (atrVal <= 0) continue;

                long time = series.getBar(i).getEndTime().getEpochSecond();

                double adxVal = adx.getValue(i).doubleValue();

                double slope =
                        smaLongInd.getValue(i).doubleValue()
                                - smaLongInd.getValue(i - slopeLookback).doubleValue();

                boolean trending = adxVal > adxThreshold;
                boolean longBias = slope > 0;
                boolean shortBias = slope < 0;

                boolean upTrend =
                        price > emaSlowInd.getValue(i).doubleValue()
                                && emaFastInd.getValue(i).doubleValue() > emaMidInd.getValue(i).doubleValue();

                boolean downTrend =
                        price < emaSlowInd.getValue(i).doubleValue()
                                && emaFastInd.getValue(i).doubleValue() < emaMidInd.getValue(i).doubleValue();

                double cciNow = cci.getValue(i).doubleValue();
                double cciPrev = cci.getValue(i - 1).doubleValue();

                boolean longTrigger = cciPrev < cciOversold && cciNow > cciOversold;
                boolean shortTrigger = cciPrev > cciOverbought && cciNow < cciOverbought;

                double stopDistance = atrVal * atrMultiplier;

                // ENTRY
                if (!inPosition && cooldown == 0 && trending) {

                    if (longBias && upTrend && longTrigger) {

                        positionSize = computeSize(accountSize, riskPercent, stopDistance,
                                minPositionSize, maxPositionSize);

                        if (positionSize > 0) {
                            inPosition = true;
                            isLong = true;
                            entryIndex = i;
                            trailingStop = price - stopDistance;

                            System.out.println("[ENTRY LONG] " + symbol +
                                    " price=" + price +
                                    " size=" + positionSize +
                                    " time=" + time +
                                    " atr=" + atrVal +
                                    " stopDist=" + stopDistance +
                                    " trailingStart=" + trailingStop);

                            tradesOut.add(trade(symbol, time, positionSize, "BUY"));
                        }
                        continue;
                    }

                    if (allowShorts && shortBias && downTrend && shortTrigger) {

                        positionSize = computeSize(accountSize, riskPercent, stopDistance,
                                minPositionSize, maxPositionSize);

                        if (positionSize > 0) {
                            inPosition = true;
                            isLong = false;
                            entryIndex = i;
                            trailingStop = price + stopDistance;

                            System.out.println("[ENTRY SHORT] " + symbol +
                                    " price=" + price +
                                    " size=" + positionSize +
                                    " time=" + time +
                                    " atr=" + atrVal +
                                    " stopDist=" + stopDistance +
                                    " trailingStart=" + trailingStop);

                            tradesOut.add(trade(symbol, time, -positionSize, "SHORT"));
                        }
                    }
                }

                if (!inPosition || positionSize <= 0) continue;
                if ((i - entryIndex) < minHoldBars) continue;

                double prevPrice = close.getValue(i - 1).doubleValue();
                double prevEma = emaFastInd.getValue(i - 1).doubleValue();
                double emaNow = emaFastInd.getValue(i).doubleValue();

                // trailing
                if (useTrailingStop) {
                    if (isLong)
                        trailingStop = Math.max(trailingStop, price - stopDistance);
                    else
                        trailingStop = Math.min(trailingStop, price + stopDistance);
                }

                // DEBUG BAR
                System.out.println("[BAR] " + symbol +
                        " i=" + i +
                        " price=" + price +
                        " prevPrice=" + prevPrice +
                        " emaNow=" + emaNow +
                        " prevEma=" + prevEma +
                        " trailingStop=" + trailingStop +
                        " held=" + (i - entryIndex));

                boolean exitTrailing =
                        (isLong && price < trailingStop) ||
                        (!isLong && price > trailingStop);

                boolean exitEma = false;

                if (useEmaExit) {
                    double buffer = atrVal * 0.2;

                    boolean emaBreakNow = isLong
                            ? price < emaNow - buffer
                            : price > emaNow + buffer;

                    boolean emaBreakPrev = isLong
                            ? prevPrice < prevEma
                            : prevPrice > prevEma;

                    if (emaBreakNow && emaBreakPrev)
                        exitEma = true;
                }

                boolean exit = exitTrailing || exitEma;

                if (exit) {
                    System.out.println("[EXIT] " + symbol +
                            " price=" + price +
                            " size=" + positionSize +
                            " heldBars=" + (i - entryIndex) +
                            " time=" + time +
                            " reason=" +
                            (exitTrailing ? "TRAILING " : "") +
                            (exitEma ? "EMA " : "") +
                            " trailingStop=" + trailingStop +
                            " emaNow=" + emaNow);

                    tradesOut.add(trade(symbol, time,
                            isLong ? -positionSize : positionSize,
                            isLong ? "SELL" : "COVER"));

                    inPosition = false;
                    positionSize = 0;
                    entryIndex = -1;
                    cooldown = cooldownBars;
                }
            }
        }

        ObjectNode root = MAPPER.createObjectNode();
        root.put("status", "ok");

        var arr = root.putArray("trades");
        tradesOut.forEach(arr::add);

        System.out.println(MAPPER.writeValueAsString(root));
    }

    private static int computeSize(double account, double risk, double stopDistance,
                                   int min, int max) {
        double riskAmount = account * risk;
        int size = (int) Math.floor(riskAmount / stopDistance);
        return Math.max(min, Math.min(max, size));
    }

    private static ObjectNode trade(String symbol, long time, int amount, String type) {
        ObjectNode t = MAPPER.createObjectNode();
        t.put("symbol", symbol);
        t.put("time", time);
        t.put("amount", amount);
        t.put("type", type);
        return t;
    }

    private static double parse(String s) {
        return (s == null || s.isEmpty()) ? 0.0 : Double.parseDouble(s);
    }

    private static String envOr(String k, String d) {
        String v = System.getenv(k);
        return (v == null || v.isBlank()) ? d : v;
    }
}
