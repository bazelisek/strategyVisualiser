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

  return validCandles.map((c, i) => ({
    time: c.time as UTCTimestamp,
    value: i >= cciLength - 1 ? cciValues[i - (cciLength - 1)] : undefined,
  }));
}

export function createCCIGraph(
  cciChart: IChartApi | null,
  config: { cciLength: number },
  candles: candleData,
) {
  if (!cciChart) return;
  const cciSeries = cciChart.addSeries(LineSeries, {
    color: "#f829ffff",
    lineWidth: 1,
  });

  cciSeries.createPriceLine({ price: 100, color: "red", lineWidth: 1 });
  cciSeries.createPriceLine({ price: -100, color: "green", lineWidth: 1 });

  cciSeries.setData(calculateCCISeriesData(candles, config.cciLength));
}
