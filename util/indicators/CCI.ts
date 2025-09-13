import { UTCTimestamp } from "lightweight-charts";
import { CCI } from "technicalindicators";

export function calculateCCISeriesData(
  candleData: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[],
  cciLength: number
): { time: UTCTimestamp; value?: number }[] {
  const validCandles = candleData;
  const closes = validCandles.map((c) => c.close);
  const lows = validCandles.map((c) => c.low);
  const highs = validCandles.map((c) => c.high);

  const cciValues = CCI.calculate({
    period: cciLength,
    close: closes,
    high: highs,
    low: lows,
  });

  return validCandles.map((c, i) => ({
    time: c.time as UTCTimestamp,
    value: i >= cciLength - 1 ? cciValues[i - (cciLength - 1)] : undefined,
  }));
}
