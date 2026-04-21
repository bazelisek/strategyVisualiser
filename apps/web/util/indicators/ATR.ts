import { IChartApi, LineSeries, UTCTimestamp } from "lightweight-charts";
import { ATR } from "technicalindicators";
import { candleData } from "../serverFetch";

export function calculateATRSeriesData(
  candleData: candleData,
  atrLength: number
): { time: UTCTimestamp; value?: number }[] {
  const validCandles = candleData;

  const highs = validCandles.map((c) => c.high);
  const lows = validCandles.map((c) => c.low);
  const closes = validCandles.map((c) => c.close);

  const atrValues = ATR.calculate({
    period: atrLength,
    high: highs,
    low: lows,
    close: closes,
  });

  const lookback = atrLength - 1;

  return validCandles.map((c, i) => {
    const value =
      i >= lookback
        ? atrValues[i - lookback]
        : undefined;

    return {
      time: c.time as UTCTimestamp,
      value:
        typeof value === "number" && !isNaN(value)
          ? value
          : undefined,
    };
  });
}

export function createATRGraph(
  atrChart: IChartApi | null,
  config: { atrLength: number; color: string } | undefined,
  candles: candleData
) {
  if (!atrChart || !config) return;

  const atrSeries = atrChart.addSeries(LineSeries, {
    color: config.color,
    lineWidth: 1,
  });

  atrSeries.setData(
    calculateATRSeriesData(candles, config.atrLength)
  );

  return atrSeries;
}