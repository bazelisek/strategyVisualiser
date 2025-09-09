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
  const maData = [];

  for (let i = 0; i < candleData.length; i++) {
    if (i < maLength) {
      // Provide whitespace data points until the MA can be calculated
      maData.push({ time: candleData[i].time });
    } else {
      // Calculate the moving average, slow but simple way
      let sum = 0;
      for (let j = 0; j < maLength; j++) {
        sum += candleData[i - j].close;
      }
      const maValue = sum / maLength;
      maData.push({ time: candleData[i].time, value: maValue });
    }
  }

  return maData;
}
