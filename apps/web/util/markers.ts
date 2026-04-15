import { IChartApi, SeriesMarker, Time } from "lightweight-charts";

export function getTradeMarkers(fetchData: { time: number; amount: number }[]) {
  return fetchData.map(({ time, amount }, index): SeriesMarker<Time> => ({
    id: `${time}-${index}-${amount < 0 ? "sell" : "buy"}`,
    time: time as Time,
    position: amount < 0 ? "belowBar" : "aboveBar",
    shape: amount < 0 ? "arrowDown" : "arrowUp",
    color: amount < 0 ? "#F7525F" : "#22AB94",
    text: `${amount < 0 ? "Sell" : "Buy"} ${Math.abs(amount)}`,
  }));
}

export function centerToMarker(markerTime: Time, chart: IChartApi) {
  const logicalRange = chart.timeScale().getVisibleLogicalRange();
  if (!logicalRange) return;

  const markerIndex = chart.timeScale().timeToIndex(markerTime, true);
  if (markerIndex === null) return;

  const rangeLength = logicalRange.to - logicalRange.from;
  const markerLogical = Number(markerIndex);

  chart.timeScale().setVisibleLogicalRange({
    from: markerLogical - rangeLength / 2,
    to: markerLogical + rangeLength / 2,
  });
}


export function toUTCTimestamp(time: Time): number | null {
  if (typeof time === 'number') {
    return time; // already UTCTimestamp
  } 
  if (typeof time === 'string') {
    const date = new Date(time);
    return isNaN(date.getTime()) ? null : Math.floor(date.getTime() / 1000);
  } 
  if ('year' in time && 'month' in time && 'day' in time) {
    const date = new Date(Date.UTC(time.year, time.month - 1, time.day));
    return Math.floor(date.getTime() / 1000);
  }
  return null;
}
