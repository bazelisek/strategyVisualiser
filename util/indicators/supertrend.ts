import { IChartApi, LineSeries, UTCTimestamp } from "lightweight-charts";
import { supertrend } from "supertrend";
import { candleData } from "../serverFetch";

export function calculateSupertrendSeriesData(
  candleData: candleData,
  multiplier: number,
  period: number
): { time: UTCTimestamp; value?: number }[] {
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

export function createSTGraph(
  mainChart: IChartApi,
  config: { multiplier: number; period: number },
  candles: candleData,
): void {
  const supertrendSeries = mainChart.addSeries(LineSeries, {
    color: "#adff29",
    lineWidth: 1,
  });

  supertrendSeries.setData(
    calculateSupertrendSeriesData(candles, config.multiplier, config.period)
  );
}
