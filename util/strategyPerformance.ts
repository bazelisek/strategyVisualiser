interface Candle {
  time: string; // UTC timestamp string
  open: number;
  high: number;
  low: number;
  close: number;
}

interface StrategyPoint {
  time: number; // UTC timestamp int
  amount: number; // >0 = buy, <0 = sell
}

interface PerformancePoint {
  time: string;
  price: number;
  avgBuyPrice: number | null;
  currentCapital: number;
  portfolioValue: number;
  totalValue: number;
  action: string;
}

export function calculateStrategyPerformance(
  startingCapital: number,
  strategyData: StrategyPoint[],
  transformedData: { candles: Candle[] }
): PerformancePoint[] {
  let cash = startingCapital;
  let ownedShares = 0;
  let totalCostBasis = 0; // total money spent on owned shares

  const result: PerformancePoint[] = [];

  // pointer for candles
  let candleIndex = 0;

  for (const strategyPoint of strategyData) {
    // find the candle with matching time
    while (
      candleIndex < transformedData.candles.length &&
      transformedData.candles[candleIndex].time.toString() !==
        strategyPoint.time.toString()
    ) {
      if (
        86400 * 2 >=
        Math.abs(
          strategyPoint.time - Number(transformedData.candles[candleIndex].time)
        )
      ) {
        /*console.log(
          transformedData.candles[candleIndex].time.toString() +
            " " +
            strategyPoint.time.toString()
        );*/
      }
      candleIndex++;
    }

    if (candleIndex >= transformedData.candles.length) {
      //console.log('break');
      break;
    } // no more matches

    const candle = transformedData.candles[candleIndex];
    const openPrice = candle.open;
    let action: "BUY" | "SELL" = "BUY";

    if (strategyPoint.amount > 0) {
      // BUY
      cash -= strategyPoint.amount * openPrice;
      ownedShares += strategyPoint.amount;
      totalCostBasis += strategyPoint.amount * openPrice;
      action = "BUY " + strategyPoint.amount;
    } else if (strategyPoint.amount < 0) {
      // SELL
      const sellAmount = Math.abs(strategyPoint.amount);
      cash += sellAmount * openPrice;
      // adjust cost basis proportionally
      totalCostBasis -=
        sellAmount * (totalCostBasis / (ownedShares + sellAmount));
      ownedShares -= sellAmount;
      action = "SELL " + sellAmount;
    }

    const avgBuyPrice = ownedShares > 0 ? totalCostBasis / ownedShares : null;
    const portfolioValue = ownedShares * openPrice;
    const totalValue = cash + portfolioValue;

    result.push({
      time: candle.time,
      price: openPrice,
      avgBuyPrice,
      currentCapital: cash,
      portfolioValue,
      totalValue,
      action,
    });
  }

  return result;
}
