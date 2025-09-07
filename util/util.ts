import { SeriesMarker, Time } from "lightweight-charts";

export function getTradeMarkers(fetchData: 
  {time: number, amount:number}[]) {
  
  const tradeMarkers: SeriesMarker<Time>[] = fetchData.map((a: {time: number, amount: number}) => ({
    time: a.time as Time,
    position: a.amount < 0 ? "belowBar" : "aboveBar",
    shape: a.amount < 0 ? "arrowDown" : "arrowUp",
    color: a.amount < 0 ? "#F7525F" : "#22AB94",
    text: a.amount < 0 ? `Sell ${a.amount}` : `Buy ${a.amount}`
  }));

  return tradeMarkers;
}