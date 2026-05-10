import { candleData } from "../serverFetch";
import { EPSILON } from "./utils";
import { ResolvedTradeEvent, EquityPoint } from "./types";

/**
 * Calculates average invested amount as a ratio of current total equity (cash + open positions).
 * This ensures that as the strategy earns money, reinvesting those earnings doesn't 
 * artificially inflate the 'invested' percentage beyond what the strategy is actually 
 * risking relative to its current balance.
 */
export function getAverageInvestedPct(
  resolvedEvents: ResolvedTradeEvent[],
  candlesBySymbol: Record<string, candleData>,
  initialCash: number,
  equityCurve: EquityPoint[],
): number {
  const allTimes = Array.from(
    new Set(
      Object.values(candlesBySymbol).flatMap((candles) =>
        candles.map((candle) => Number(candle.time)),
      ),
    ),
  ).sort((a, b) => a - b);

  if (allTimes.length === 0 || initialCash <= 0 || equityCurve.length === 0) {
    return 0;
  }

  const sortedEvents = [...resolvedEvents].sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    if (a.symbol !== b.symbol) return a.symbol.localeCompare(b.symbol);
    return b.amount - a.amount;
  });

  const positionQuantityBySymbol = new Map<string, number>();
  const candleIndexBySymbol = new Map<string, number>();
  const equityMap = new Map(equityCurve.map((p) => [p.time, p.value]));
  
  let eventIndex = 0;
  let investedRatioSum = 0;

  for (const time of allTimes) {
    while (eventIndex < sortedEvents.length && sortedEvents[eventIndex].time <= time) {
      const event = sortedEvents[eventIndex];
      positionQuantityBySymbol.set(
        event.symbol,
        (positionQuantityBySymbol.get(event.symbol) ?? 0) + event.amount,
      );
      eventIndex++;
    }

    let investedValue = 0;

    Object.entries(candlesBySymbol).forEach(([symbol, candles]) => {
      if (candles.length === 0) {
        return;
      }

      let candleIndex = candleIndexBySymbol.get(symbol) ?? 0;
      while (
        candleIndex + 1 < candles.length &&
        Number(candles[candleIndex + 1].time) <= time
      ) {
        candleIndex++;
      }
      candleIndexBySymbol.set(symbol, candleIndex);

      const quantity = positionQuantityBySymbol.get(symbol) ?? 0;
      if (Math.abs(quantity) <= EPSILON) {
        return;
      }

      investedValue += quantity * candles[candleIndex].open;
    });

    const currentEquity = equityMap.get(time) ?? initialCash;
    investedRatioSum += currentEquity > 0 ? (investedValue / currentEquity) : 0;
  }

  return investedRatioSum / allTimes.length;
}

export function getBuyAndHoldPct(candles: candleData): number {
  if (candles.length === 0) return 0;
  return ((candles[candles.length - 1].open - candles[0].open) / candles[0].open) * 100;
}
