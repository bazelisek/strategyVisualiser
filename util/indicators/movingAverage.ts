import { IChartApi, LineSeries, UTCTimestamp } from "lightweight-charts";
import { SMA } from "technicalindicators";
import { candleData } from "../serverFetch";

export function calculateMovingAverageSeriesData(
  candleData: candleData,
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

export function createMAGraph(
  mainChart: IChartApi,
  config: {maLength: number, color: string},
  candles: candleData
): void {
  const ma = mainChart.addSeries(LineSeries, {
    color: config.color,
    lineWidth: 1,
  });
  ma.setData(calculateMovingAverageSeriesData(candles, config.maLength));
}
