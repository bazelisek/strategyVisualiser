import { IChartApi, LineSeries, UTCTimestamp } from "lightweight-charts";
import { ADX } from "technicalindicators";
import { candleData } from "../serverFetch";

export function calculateADXSeriesData(
  candleData: candleData,
  adxLength: number,
): { time: UTCTimestamp; value?: number }[] {
  const validCandles = candleData;
  const closes = validCandles.map((c) => c.close);
  const lows = validCandles.map((c) => c.low);
  const highs = validCandles.map((c) => c.high);

  const adxValues = ADX.calculate({
    period: adxLength,
    close: closes,
    high: highs,
    low: lows,
  });

  const lookback = 2 * adxLength - 1;

  return validCandles.map((c, i) => {
    const raw = i >= lookback ? adxValues[i - lookback] : undefined;

    const value = raw?.adx;

    return {
      time: c.time as UTCTimestamp,
      value: typeof value === "number" && !isNaN(value) ? value : undefined,
    };
  });
}

export function createADXGraph(
  adxChart: IChartApi | null,
  config: { adxLength: number; color: string } | undefined,
  candles: candleData,
) {
  if (!adxChart || !config) return;
  const adxSeries = adxChart.addSeries(LineSeries, {
    color: config.color,
    lineWidth: 1,
  });

  // Calculate and set adx data
  adxSeries.setData(calculateADXSeriesData(candles, config.adxLength));

  return adxSeries;
}
