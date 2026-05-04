import { candleData } from "../serverFetch";
import { EPSILON, normalizeCashBase } from "./utils";
import {
  SimulationResult,
  ResolvedTradeEvent,
  OpenLot,
  Trade,
  EquityPoint,
} from "./types";

export function simulateTrades(
  resolvedEvents: ResolvedTradeEvent[],
  candlesBySymbol: Record<string, candleData>,
  initialCash?: number,
  feeRate: number = 0.0005,
): { data?: SimulationResult; error?: string } {
  const sortedEvents = [...resolvedEvents].sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    if (a.symbol !== b.symbol) return a.symbol.localeCompare(b.symbol);
    // Process sells before buys at the same timestamp
    return a.amount - b.amount;
  });

  const allTimes = Array.from(
    new Set(
      Object.values(candlesBySymbol).flatMap((candles) =>
        candles.map((candle) => Number(candle.time)),
      ),
    ),
  ).sort((a, b) => a - b);

  if (allTimes.length === 0) {
    return { error: "No candlestick data found." };
  }

  const openLots = new Map<string, OpenLot[]>();
  const symbolQuantity = new Map<string, number>();
  const candleIndexBySymbol = new Map<string, number>();
  const trades: Trade[] = [];
  let totalBuys = 0;
  let totalSells = 0;
  let totalBuyValue = 0;
  let totalSellValue = 0;

  const totalResolvedBuyValue = sortedEvents
    .filter((event) => event.amount > 0)
    .reduce((sum, event) => sum + event.amount * event.price, 0);
  const cashBase = normalizeCashBase(initialCash, totalResolvedBuyValue);
  let cash = cashBase;

  const equityCurve: EquityPoint[] = [];
  let eventIndex = 0;

  for (const time of allTimes) {
    // Process all events up to and including this time
    while (
      eventIndex < sortedEvents.length &&
      sortedEvents[eventIndex].time <= time
    ) {
      const event = sortedEvents[eventIndex];
      const symbolLots = openLots.get(event.symbol) ?? [];
      openLots.set(event.symbol, symbolLots);

      if (event.amount > 0) {
        totalBuys++;
        const buyValue = event.amount * event.price;
        const fee = buyValue * feeRate;
        
        if (cash >= buyValue + fee - EPSILON) {
          totalBuyValue += buyValue;
          cash -= (buyValue + fee);
          symbolLots.push({
            symbol: event.symbol,
            quantity: event.amount,
            buyPrice: event.price,
            buyTime: event.time,
          });
          symbolQuantity.set(
            event.symbol,
            (symbolQuantity.get(event.symbol) ?? 0) + event.amount,
          );
        } else {
          // Partial buy
          const maxBuyValue = cash;
          if (maxBuyValue > fee) {
            const actualBuyValue = maxBuyValue - fee;
            const actualAmount = actualBuyValue / event.price;
            if (actualAmount > EPSILON) {
              totalBuyValue += actualBuyValue;
              cash -= maxBuyValue;
              symbolLots.push({
                symbol: event.symbol,
                quantity: actualAmount,
                buyPrice: event.price,
                buyTime: event.time,
              });
              symbolQuantity.set(
                event.symbol,
                (symbolQuantity.get(event.symbol) ?? 0) + actualAmount,
              );
            }
          }
        }
      } else {
        totalSells++;
        let remaining = Math.abs(event.amount);
        const currentQty = symbolQuantity.get(event.symbol) ?? 0;
        
        // Adjust to not sell more than held
        if (remaining > currentQty + EPSILON) {
          remaining = currentQty;
        }

        if (remaining <= EPSILON) {
          continue;
        }

        symbolQuantity.set(
          event.symbol,
          Math.max(0, currentQty - remaining),
        );

        while (remaining > EPSILON && symbolLots.length > 0) {
          const lot = symbolLots[0];
          const matchedQuantity = Math.min(remaining, lot.quantity);
          const sellValue = matchedQuantity * event.price;
          const fee = sellValue * feeRate;
          const buyValue = matchedQuantity * lot.buyPrice;

          trades.push({
            symbol: event.symbol,
            time: event.time,
            amount: -matchedQuantity,
            price: event.price,
            buyValue,
            sellValue,
            result: sellValue - buyValue - fee,
            isOpen: false,
          });

          totalSellValue += sellValue;
          cash += (sellValue - fee);
          remaining -= matchedQuantity;
          lot.quantity -= matchedQuantity;

          if (lot.quantity <= EPSILON) {
            symbolLots.shift();
          }
        }
      }
      eventIndex++;
    }

    // Calculate equity for current time
    let currentEquity = cash;
    for (const [symbol, quantity] of symbolQuantity) {
      if (Math.abs(quantity) <= EPSILON) continue;

      const candles = candlesBySymbol[symbol];
      if (!candles) continue;

      let cIdx = candleIndexBySymbol.get(symbol) ?? 0;
      while (cIdx < candles.length && Number(candles[cIdx].time) < time) {
        cIdx++;
      }
      candleIndexBySymbol.set(symbol, cIdx);

      if (cIdx < candles.length && Number(candles[cIdx].time) === time) {
        currentEquity += quantity * candles[cIdx].open;
      } else if (cIdx > 0) {
        currentEquity += quantity * candles[cIdx - 1].open;
      }
    }
    equityCurve.push({ time, value: currentEquity });
  }

  // Handle remaining open trades for the final stats
  openLots.forEach((symbolLots, symbol) => {
    const symbolCandles = candlesBySymbol[symbol];
    if (!symbolCandles || symbolCandles.length === 0) {
      return;
    }

    const lastCandle = symbolCandles[symbolCandles.length - 1];
    const lastPrice = lastCandle.open;
    const lastTime = Number(lastCandle.time);

    for (const lot of symbolLots) {
      if (lot.quantity <= EPSILON) {
        continue;
      }

      const sellValue = lot.quantity * lastPrice;
      const buyValue = lot.quantity * lot.buyPrice;

      trades.push({
        symbol: symbol,
        time: lot.buyTime,
        amount: lot.quantity,
        price: lot.buyPrice,
        buyValue,
        sellValue,
        result: sellValue - buyValue,
        isOpen: true,
      });
    }
  });

  const closedTrades = trades.filter((trade) => !trade.isOpen).length;
  const openTrades = trades.filter((trade) => trade.isOpen).length;
  const lastEquity = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].value : cash;

  return {
    data: {
      trades,
      totalBuys,
      totalSells,
      endingCash: cash,
      endingValue: lastEquity,
      closedTrades,
      openTrades,
      totalBuyValue,
      totalSellValue,
      equityCurve,
    },
  };
}
