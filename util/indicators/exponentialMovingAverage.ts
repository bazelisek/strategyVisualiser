import { IChartApi, LineSeries, UTCTimestamp } from "lightweight-charts";
import { EMA } from "technicalindicators";
import { candleData } from "../serverFetch";

export function calculateExponentialMovingAverageSeriesData(
  candleData: candleData,
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

export function createEMAGraph(mainChart: IChartApi,
  config: {emaLength: number, color: string},
  candles: candleData) {
  const ema = mainChart.addSeries(LineSeries, {
    color: config.color,
    lineWidth: 1,
  });
  ema.setData(
    calculateExponentialMovingAverageSeriesData(
      candles,
      config.emaLength
    )
  );
}
