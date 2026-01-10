import { IChartApi, LineSeries, UTCTimestamp } from "lightweight-charts";
import { CCI } from "technicalindicators";
import { candleData } from "../serverFetch";

export function calculateCCISeriesData(
  candleData: candleData,
  cciLength: number
): { time: UTCTimestamp; value?: number }[] {
  const validCandles = candleData;
  const closes = validCandles.map((c) => c.close);
  const lows = validCandles.map((c) => c.low);
  const highs = validCandles.map((c) => c.high);

  const cciValues = CCI.calculate({
    period: cciLength,
    close: closes,
    high: highs,
    low: lows,
  });

  return validCandles.map((c, i) => {
    const value = i >= cciLength - 1 ? cciValues[i - (cciLength - 1)] : undefined;
    return {
      time: c.time as UTCTimestamp,
      // Only include valid numeric values
      value: typeof value === 'number' && !isNaN(value) ? value : undefined
    };
  });
}

export function createCCIGraph(
  cciChart: IChartApi | null,
  config: { cciLength: number, color: string } | undefined,
  candles: candleData,
  addLines: boolean = true
) {
  if (!cciChart || !config) return;
  const cciSeries = cciChart.addSeries(LineSeries, {
    color: config.color,
    lineWidth: 1,
  });

  // Calculate and set CCI data
  cciSeries.setData(calculateCCISeriesData(candles, config.cciLength));

  // Only add the horizontal lines if addLines is true
  if (addLines) {
    cciSeries.createPriceLine({ price: 100, color: "red", lineWidth: 1 });
    cciSeries.createPriceLine({ price: -100, color: "green", lineWidth: 1 });
  }

  return cciSeries;
}
