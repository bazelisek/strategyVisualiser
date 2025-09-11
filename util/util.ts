import { SeriesMarker, Time } from "lightweight-charts";
import { CCI, SMA, EMA } from "technicalindicators";

export function getTradeMarkers(fetchData: { time: number; amount: number }[]) {
  const tradeMarkers: SeriesMarker<Time>[] = fetchData.map(
    (a: { time: number; amount: number }) => ({
      time: a.time as Time,
      position: a.amount < 0 ? "belowBar" : "aboveBar",
      shape: a.amount < 0 ? "arrowDown" : "arrowUp",
      color: a.amount < 0 ? "#F7525F" : "#22AB94",
      text: a.amount < 0 ? `Sell ${a.amount}` : `Buy ${a.amount}`,
    })
  );

  return tradeMarkers;
}

export function calculateMovingAverageSeriesData(
  candleData: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[],
  maLength: number
): { time: number; value?: number }[] {
  const validCandles = candleData;
  const closes = validCandles.map((c) => c.close);

  const smaValues = SMA.calculate({ period: maLength, values: closes });

  const maData: { time: number; value?: number }[] = validCandles.map(
    (c, i) => ({
      time: c.time,
      value: i >= maLength - 1 ? smaValues[i - (maLength - 1)] : undefined,
    })
  );

  return maData;
}

export function calculateExponentialMovingAverageSeriesData(
  candleData: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[],
  emaLength: number
): { time: number; value?: number }[] {
  const validCandles = candleData;
  const closes = validCandles.map((c) => c.close);

  const emaValues = EMA.calculate({ period: emaLength, values: closes });

  return validCandles.map((c, i) => ({
    time: c.time,
    value: i >= emaLength - 1 ? emaValues[i - (emaLength - 1)] : undefined,
  }));
}

export function calculateCCISeriesData(
  candleData: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[],
  cciLength: number
): { time: number; value?: number }[] {
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
    time: c.time,
    value: i >= cciLength - 1 ? cciValues[i - (cciLength - 1)] : undefined,
  }));
}
