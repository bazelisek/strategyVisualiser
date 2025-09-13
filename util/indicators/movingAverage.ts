import { UTCTimestamp } from "lightweight-charts";
import { SMA } from "technicalindicators";

export function calculateMovingAverageSeriesData(
  candleData: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[],
  maLength: number
): { time: UTCTimestamp; value?: number }[] {
  const validCandles = candleData;
  const closes = validCandles.map((c) => c.close);

  const smaValues = SMA.calculate({ period: maLength, values: closes });

  const maData: { time: UTCTimestamp; value?: number }[] = validCandles.map(
    (c, i) => ({
      time: c.time as UTCTimestamp,
      value: i >= maLength - 1 ? smaValues[i - (maLength - 1)] : undefined,
    })
  );

  return maData;
}