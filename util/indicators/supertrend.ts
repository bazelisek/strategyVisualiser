import { UTCTimestamp } from "lightweight-charts";
import { supertrend } from "supertrend";

export function calculateSupertrendSeriesData(
  candleData: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[],
  multiplier: number,
  period: number
): { time: UTCTimestamp, value?: number }[] {
  const transformedData = candleData.map((candle) => {
    return {
      high: candle.high,
      low: candle.low,
      close: candle.close,
    };
  });
  const supertrendData = supertrend({
    initialArray: transformedData,
    period,
    multiplier,
  });
  const result = candleData.map((candle, index) => ({
    time: candle.time as UTCTimestamp,
    value: supertrendData[index],
  }));
  return result;
}
