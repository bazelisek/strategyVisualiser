import { calculateSupertrendSeriesData } from "@/util/indicators/supertrend";

jest.mock("lightweight-charts", () => ({
  LineSeries: Symbol("LineSeries"),
}), { virtual: true });

describe("calculateSupertrendSeriesData", () => {
  test("aligns SuperTrend outputs to the original candle index after the period offset", () => {
    const candles = [
      { time: 1704067200, open: 98, high: 100, low: 95, close: 98, volume: 1000 },
      { time: 1704153600, open: 101, high: 102, low: 96, close: 101, volume: 1000 },
      { time: 1704240000, open: 104, high: 105, low: 99, close: 104, volume: 1000 },
      { time: 1704326400, open: 101, high: 108, low: 100, close: 101, volume: 1000 },
      { time: 1704412800, open: 109, high: 110, low: 104, close: 109, volume: 1000 },
      { time: 1704499200, open: 113, high: 114, low: 108, close: 113, volume: 1000 },
    ];

    const result = calculateSupertrendSeriesData(candles, 1, 3);

    expect(result).toHaveLength(candles.length);
    expect(result.slice(0, 3).map((point) => point.value)).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
    expect(result[3].value).toBe(0);
    expect(result[4].value).toBeCloseTo(114.44444444444444);
    expect(result[5].value).toBeCloseTo(114.44444444444444);
  });
});
