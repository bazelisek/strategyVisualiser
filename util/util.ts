import { SeriesMarker, Time } from "lightweight-charts";

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
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
  }[],
  maLength: number
) {
  // filter invalid candles (close must be > 0 and finite)
  const validCandles = candleData.filter(
    (c) => c && Number.isFinite(c.close) && c.close > 0
  );

  const maData: { time: string; value?: number }[] = [];

  for (let i = 0; i < validCandles.length; i++) {
    if (i < maLength - 1) {
      // not enough candles yet → placeholder point
      maData.push({ time: validCandles[i].time });
    } else {
      let sum = 0;
      for (let j = 0; j < maLength; j++) {
        sum += validCandles[i - j].close;
      }
      const maValue = sum / maLength;
      maData.push({ time: validCandles[i].time, value: maValue });
    }
  }

  return maData;
}
