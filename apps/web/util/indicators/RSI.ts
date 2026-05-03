import { IChartApi, LineSeries, UTCTimestamp } from "lightweight-charts";
import { RSI } from "technicalindicators";
import { candleData } from "../serverFetch";

export function calculateRSISeriesData(
  candleData: candleData,
  rsiLength: number,
): { time: UTCTimestamp; value?: number }[] {
  const validCandles = candleData;
  const closes = validCandles.map((c) => c.close);

  const rsiValues = RSI.calculate({
    period: rsiLength,
    values: closes,
  });

  return validCandles.map((c, i) => {
    const value = i >= rsiLength ? rsiValues[i - rsiLength] : undefined;

    return {
      time: c.time as UTCTimestamp,
      value: typeof value === "number" && !isNaN(value) ? value : undefined,
    };
  });
}

export function createRSIGraph(
  rsiChart: IChartApi | null,
  config: { rsiLength: number; color: string } | undefined,
  candles: candleData,
) {
  if (!rsiChart || !config) return;
  const rsiSeries = rsiChart.addSeries(LineSeries, {
    color: config.color,
    lineWidth: 1,
  });

  rsiSeries.setData(calculateRSISeriesData(candles, config.rsiLength));

  return rsiSeries;
}
