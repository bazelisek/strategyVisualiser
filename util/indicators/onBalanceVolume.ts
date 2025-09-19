import { IChartApi, LineSeries, UTCTimestamp } from "lightweight-charts";
import { OBV } from "technicalindicators";
import { candleData } from "../serverFetch";

export function calculateOnBalanceVolumeData(
  candleData: candleData,
): { time: UTCTimestamp; value?: number }[] {
  const validCandles = candleData;
  const closes = validCandles.map((c) => c.close);
  const volumes = validCandles.map((c) => c.volume);

  const obvValues = OBV.calculate({ close: closes, volume: volumes });

  const obvData: { time: UTCTimestamp; value?: number }[] = validCandles.map(
    (c, i) => ({
      time: c.time as UTCTimestamp,
      value: obvValues[i],
    })
  );

  return obvData;
}
export function createOBVGraph(
  obvChart: IChartApi | null,
  config: {color: string},
  candles: candleData
): void {
    if (!obvChart) return;
  const ma = obvChart.addSeries(LineSeries, {
    color: config.color,
    lineWidth: 1,
  });
  ma.setData(calculateOnBalanceVolumeData(candles));
}
