import { IChartApi, LineSeries, UTCTimestamp } from "lightweight-charts";
import { BollingerBands } from "technicalindicators";
import { candleData } from "../serverFetch";

export function calculateBollingerBandsSeriesData(
  candleData: candleData,
  bbPeriod: number,
  bbStdDev: number,
): {
  upper: { time: UTCTimestamp; value?: number }[];
  middle: { time: UTCTimestamp; value?: number }[];
  lower: { time: UTCTimestamp; value?: number }[];
} {
  const validCandles = candleData;
  const closes = validCandles.map((c) => c.close);

  const bbValues = BollingerBands.calculate({
    period: bbPeriod,
    values: closes,
    stdDev: bbStdDev,
  });

  const upper: { time: UTCTimestamp; value?: number }[] = [];
  const middle: { time: UTCTimestamp; value?: number }[] = [];
  const lower: { time: UTCTimestamp; value?: number }[] = [];

  validCandles.forEach((c, i) => {
    const raw = i >= bbPeriod - 1 ? bbValues[i - (bbPeriod - 1)] : undefined;
    const time = c.time as UTCTimestamp;

    upper.push({
      time,
      value: typeof raw?.upper === "number" && !isNaN(raw.upper) ? raw.upper : undefined,
    });
    middle.push({
      time,
      value: typeof raw?.middle === "number" && !isNaN(raw.middle) ? raw.middle : undefined,
    });
    lower.push({
      time,
      value: typeof raw?.lower === "number" && !isNaN(raw.lower) ? raw.lower : undefined,
    });
  });

  return { upper, middle, lower };
}

export function createBollingerBandsGraph(
  chart: IChartApi | null,
  config: { bbPeriod: number; bbStdDev: number; color: string } | undefined,
  candles: candleData,
) {
  if (!chart || !config) return;

  const { upper, middle, lower } = calculateBollingerBandsSeriesData(
    candles,
    config.bbPeriod,
    config.bbStdDev,
  );

  const upperSeries = chart.addSeries(LineSeries, {
    color: config.color,
    lineWidth: 1,
    lineStyle: 2, // Dashed
    title: 'BB Upper',
  });
  const middleSeries = chart.addSeries(LineSeries, {
    color: config.color,
    lineWidth: 1,
    title: 'BB Middle',
  });
  const lowerSeries = chart.addSeries(LineSeries, {
    color: config.color,
    lineWidth: 1,
    lineStyle: 2, // Dashed
    title: 'BB Lower',
  });

  upperSeries.setData(upper);
  middleSeries.setData(middle);
  lowerSeries.setData(lower);
}
