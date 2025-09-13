import { UTCTimestamp } from "lightweight-charts";
import { EMA } from "technicalindicators";

export function calculateExponentialMovingAverageSeriesData(
  candleData: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[],
  emaLength: number
): { time: UTCTimestamp; value?: number }[] {
  const validCandles = candleData;
  const closes = validCandles.map((c) => c.close);

  const emaValues = EMA.calculate({ period: emaLength, values: closes });

  return validCandles.map((c, i) => ({
    time: c.time as UTCTimestamp,
    value: i >= emaLength - 1 ? emaValues[i - (emaLength - 1)] : undefined,
  }));
}
