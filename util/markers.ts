import { IChartApi, SeriesMarker, Time, UTCTimestamp } from "lightweight-charts";

export function getTradeMarkers(fetchData: { time: number; amount: number }[]) {
  return fetchData.map(({ time, amount }): SeriesMarker<Time> => ({
    time: time as Time,
    position: amount < 0 ? "belowBar" : "aboveBar",
    shape: amount < 0 ? "arrowDown" : "arrowUp",
    color: amount < 0 ? "#F7525F" : "#22AB94",
    text: `${amount < 0 ? "Sell" : "Buy"} ${Math.abs(amount)}`,
  }));
}

export function centerToMarker(markerTime: Time, chart: IChartApi) {
  const visibleRange = chart.timeScale().getVisibleRange();
  if (!visibleRange) return;

  const { from, to } = visibleRange;

  const fromTS = toUTCTimestamp(from);
  const toTS = toUTCTimestamp(to);
  const markerTS = toUTCTimestamp(markerTime);

  if (fromTS === null || toTS === null || markerTS === null) return;

  const rangeLength = toTS - fromTS;

  chart.timeScale().setVisibleRange({
    from: markerTS - rangeLength / 2 as UTCTimestamp,
    to: markerTS + rangeLength / 2 as UTCTimestamp,
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
