import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;

import java.io.*;
import java.nio.file.*;
import java.time.*;
import java.util.*;

public class StrategyMain {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        Path configPath = Path.of(env("STRATEGY_CONFIG_FILE", "config.json"));
        Path csvPath = Path.of(env("STRATEGY_STOCK_DATA_FILE", "stock-data.csv"));

        JsonNode cfg = MAPPER.readTree(Files.readString(configPath));

        int period = cfg.path("supertrendPeriod").asInt(10);
        double multiplier = cfg.path("multiplier").asDouble(3.0);
        double thresholdUp = cfg.path("thresholdUp").asDouble(1.0);
        double thresholdDown = cfg.path("thresholdDown").asDouble(1.0);

        Map<String, List<Bar>> data = load(csvPath);

        List<Trade> trades = new ArrayList<>();

        for (var e : data.entrySet()) {
            trades.addAll(run(
                    e.getKey(),
                    e.getValue(),
                    period,
                    multiplier,
                    thresholdUp,
                    thresholdDown
            ));
        }

        trades.sort(Comparator.comparingLong(t -> t.time));

        ObjectNode out = MAPPER.createObjectNode();
        out.put("status", "ok");
        ArrayNode arr = out.putArray("trades");

        for (Trade t : trades) {
            ObjectNode o = arr.addObject();
            o.put("symbol", t.symbol);
            o.put("time", t.time);
            o.put("amount", t.amount);
        }

        System.out.println(MAPPER.writeValueAsString(out));
    }

    // ============================================================
    // SUPERTREND PORT
    // ============================================================
    //
    // This is a pure-Java port of the frontend logic, but aligned so
    // the ATR and the shifted bar window correspond correctly.
    //
    // Frontend logic:
    //  - build arrays of high/low/close
    //  - ATR.calculate(...)
    //  - shift the first `period` bars off the source array
    //  - compute bands from the shifted bars + ATR values
    //
    // Here we reproduce the same effective alignment:
    //  - ATR starts at bar index `period`
    //  - band arrays also start at bar index `period`
    //
    // ============================================================

    private static List<Trade> run(String symbol,
                               List<Bar> bars,
                               int period,
                               double multiplier,
                               double thresholdUp,
                               double thresholdDown) {

    int n = bars.size();
    List<Trade> trades = new ArrayList<>();
    if (n <= period) return trades;

    // === BUILD ARRAYS ===
    double[] high = new double[n];
    double[] low = new double[n];
    double[] close = new double[n];

    for (int i = 0; i < n; i++) {
        high[i] = bars.get(i).high;
        low[i] = bars.get(i).low;
        close[i] = bars.get(i).close;
    }

    // === TRUE RANGE ===
    double[] tr = new double[n];
    for (int i = 0; i < n; i++) {
        if (i == 0) {
            tr[i] = high[i] - low[i];
        } else {
            double r1 = high[i] - low[i];
            double r2 = Math.abs(high[i] - close[i - 1]);
            double r3 = Math.abs(low[i] - close[i - 1]);
            tr[i] = Math.max(r1, Math.max(r2, r3));
        }
    }

    // === ATR (match technicalindicators) ===
    double[] atrFull = new double[n];

    double sum = 0;
    for (int i = 0; i < n; i++) {
        if (i < period) {
            sum += tr[i];
            atrFull[i] = 0;
        } else if (i == period) {
            sum += tr[i];
            atrFull[i] = sum / period;
        } else {
            atrFull[i] = ((atrFull[i - 1] * (period - 1)) + tr[i]) / period;
        }
    }

    // === SHIFT like JS ===
    int m = n - period;

    double[] basicUpperBand = new double[m];
    double[] basicLowerBand = new double[m];

    for (int i = 0; i < m; i++) {
        int idx = i + period;

        double hl2 = (high[idx] + low[idx]) / 2.0;

        basicUpperBand[i] = hl2 + multiplier * atrFull[idx];
        basicLowerBand[i] = hl2 - multiplier * atrFull[idx];
    }

    double[] finalUpperBand = new double[m];
    double[] finalLowerBand = new double[m];

    double previousFinalUpperBand = 0;
    double previousFinalLowerBand = 0;

    for (int i = 0; i < m; i++) {

        int idx = i + period;

        if (basicUpperBand[i] < previousFinalUpperBand ||
                (i > 0 && close[idx - 1] > previousFinalUpperBand)) {
            finalUpperBand[i] = basicUpperBand[i];
        } else {
            finalUpperBand[i] = previousFinalUpperBand;
        }

        if (basicLowerBand[i] > previousFinalLowerBand ||
                (i > 0 && close[idx - 1] < previousFinalLowerBand)) {
            finalLowerBand[i] = basicLowerBand[i];
        } else {
            finalLowerBand[i] = previousFinalLowerBand;
        }

        previousFinalUpperBand = finalUpperBand[i];
        previousFinalLowerBand = finalLowerBand[i];
    }

    // === SUPERTREND (EXACT JS STATE MACHINE) ===
    double[] superTrend = new double[m];
    double previousSuperTrend = 0;

    for (int i = 0; i < m; i++) {

        int idx = i + period;
        double nowSuperTrend = 0;

        if (i > 0 && previousSuperTrend == finalUpperBand[i - 1] &&
                close[idx] <= finalUpperBand[i]) {

            nowSuperTrend = finalUpperBand[i];

        } else if (i > 0 && previousSuperTrend == finalUpperBand[i - 1] &&
                close[idx] > finalUpperBand[i]) {

            nowSuperTrend = finalLowerBand[i];

        } else if (i > 0 && previousSuperTrend == finalLowerBand[i - 1] &&
                close[idx] >= finalLowerBand[i]) {

            nowSuperTrend = finalLowerBand[i];

        } else if (i > 0 && previousSuperTrend == finalLowerBand[i - 1] &&
                close[idx] < finalLowerBand[i]) {

            nowSuperTrend = finalUpperBand[i];
        }

        superTrend[i] = nowSuperTrend;
        previousSuperTrend = nowSuperTrend;

        // 🔍 DEBUG
        //System.err.printf(
        //        "%s t=%d close=%.2f ST=%.2f upper=%.2f lower=%.2f\n",
        //        symbol,
        //        bars.get(idx).time,
        //        close[idx],
        //        superTrend[i],
        //        finalUpperBand[i],
        //        finalLowerBand[i]
        //);
    }

    // === STRATEGY ===
    boolean inPosition = false;

    for (int i = 0; i < m; i++) {

        int idx = i + period;
        double st = superTrend[i];
        double c = close[idx];

        if (st == 0) continue;

        if (!inPosition && (st - c) > thresholdUp) {
            trades.add(new Trade(symbol, bars.get(idx).time, 1));
            inPosition = true;
        } else if (inPosition && (c - st) > thresholdDown) {
            trades.add(new Trade(symbol, bars.get(idx).time, -1));
            inPosition = false;
        }
    }

    return trades;
}

    // ================= DATA =================

    private static Map<String, List<Bar>> load(Path path) throws IOException {
        Map<String, List<Bar>> map = new HashMap<>();

        try (BufferedReader r = Files.newBufferedReader(path)) {
            r.readLine(); // header
            String line;

            while ((line = r.readLine()) != null) {
                String[] c = line.split(",");

                String sym = c[0];

                LocalDate d = LocalDate.parse(c[2]);
                LocalTime t = c[3].isEmpty() ? LocalTime.MIDNIGHT : LocalTime.parse(c[3]);
                long time = LocalDateTime.of(d, t).toEpochSecond(ZoneOffset.UTC);

                double open = Double.parseDouble(c[4]);
                double high = Double.parseDouble(c[5]);
                double low = Double.parseDouble(c[6]);
                double close = Double.parseDouble(c[7]);

                map.computeIfAbsent(sym, k -> new ArrayList<>())
                        .add(new Bar(sym, time, open, high, low, close));
            }
        }

        for (var l : map.values()) {
            l.sort(Comparator.comparingLong(b -> b.time));
        }

        return map;
    }

    private static String env(String k, String def) {
        String v = System.getenv(k);
        return (v == null || v.isBlank()) ? def : v;
    }

    // ================= MODELS =================

    static class Bar {
        String symbol;
        long time;
        double open, high, low, close;

        Bar(String s, long t, double o, double h, double l, double c) {
            symbol = s;
            time = t;
            open = o;
            high = h;
            low = l;
            close = c;
        }
    }

    static class Trade {
        String symbol;
        long time;
        int amount;

        Trade(String s, long t, int a) {
            symbol = s;
            time = t;
            amount = a;
        }
    }
}
