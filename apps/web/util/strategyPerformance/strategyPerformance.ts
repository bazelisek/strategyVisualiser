import { candleData } from "../serverFetch";

interface StrategyPoint {
  time: number; // UTC timestamp int
  amount: number; // >0 = buy, <0 = sell
}

export type Trade = {
  buy: number;
  sell: number;
  result: number;
  buyTime: number;
  sellTime: number;
  isOpen: boolean;
};

export type StrategyPerformance = {
  data?: {
    bestTrade?: Trade;
    worstTrade?: Trade;
    totalBuys: number;
    totalSells: number;
    closedTrades: number;
    openTrades: number;
    trades: Trade[];
    earningsWithoutStrategyPct: number;
    timeInvested: number;
  };
  error?: string;
};

export function getStrategyPerformance(
  strategyData: StrategyPoint[],
  transformedData: { candles: candleData },
): StrategyPerformance {
  const opens = transformedData.candles.map((candle) => ({
    value: candle.open,
    time: candle.time,
  }));

  if (strategyData.length === 0) return { error: "No buy/sell data." };

  strategyData = strategyData.sort((a, b) => a.time - b.time);
  const buys = strategyData.filter((point) => point.amount > 0);
  const sells = strategyData.filter((point) => point.amount < 0);
  const flatBuys: { time: number }[] = buys
    .map((buy) => {
      const newBuy: { time: number }[] = [];
      for (let i = 0; i < buy.amount; i++) {
        newBuy.push({ time: buy.time });
      }
      return newBuy;
    })
    .flat();
  const flatSells: { time: number }[] = sells
    .map((sell) => {
      const newSell: { time: number }[] = [];
      for (let i = 0; i < Math.abs(sell.amount); i++) {
        newSell.push({ time: sell.time });
      }
      return newSell;
    })
    .flat();
  let totalBuys = flatBuys.length;
  let totalSells = flatSells.length;
  const openCount = Math.max(totalBuys - totalSells, 0);
  const earningsWithoutStrategy =
    (opens[opens.length - 1].value - opens[0].value) / opens[0].value;

  if (totalBuys > totalSells) {
    for (let i = 0; i < totalBuys - totalSells; i++) {
      flatSells.push({ time: opens[opens.length - 1].time });
    }
  }
  const actualSellCount = totalSells;
  totalBuys = flatBuys.length;
  totalSells = actualSellCount;

  if (flatBuys.length !== flatSells.length) {
    return { error: "Buy amount is not equal to the sell amount." };
  }

  const trades: Trade[] = [];
  let buyIndex = 0;
  let sellIndex = 0;
  let timesInvested = 0;
  for (let i = 0; i < totalBuys; i++) {
    while (
      buyIndex < opens.length - 1 &&
      opens[buyIndex].time < flatBuys[i].time
    ) {
      buyIndex++;
    }

    if (buyIndex >= opens.length || opens[buyIndex].time !== flatBuys[i].time) {
      console.error(
        "MISMATCH: " + opens[buyIndex].time + ", " + flatBuys[i].time,
      );
      return { error: "Candle and strategy times are not matching." };
    }
    const buyPrice = opens[buyIndex].value;

    while (opens[sellIndex].time < flatSells[i].time) {
      sellIndex++;
      if (sellIndex >= buyIndex)
        timesInvested++;
    }
    if (opens[sellIndex].time !== flatSells[i].time) {
      console.error(
        "MISMATCH: " + opens[sellIndex].time + ", " + flatSells[i].time,
      );
      return { error: "Candle and strategy times are not matching." };
    }
    const sellPrice = opens[sellIndex].value;

    trades.push({
      buy: buyPrice,
      sell: sellPrice,
      result: sellPrice - buyPrice,
      buyTime: opens[buyIndex].time,
      sellTime: opens[sellIndex].time,
      isOpen: i >= totalBuys - openCount,
    });
  }

  const closedTrades = trades.filter((trade) => !trade.isOpen);
  const rankedTrades = (closedTrades.length > 0 ? closedTrades : trades).toSorted(
    (a, b) => a.result - b.result,
  );
  const bestTrade: Trade | undefined = rankedTrades.at(-1);
  const worstTrade: Trade | undefined = rankedTrades[0];

  const timeInvested = timesInvested / transformedData.candles.length;

  //fetch('http://DUMMYURL/strategyPerformance')
  return {
    data: {
      bestTrade,
      worstTrade,
      totalBuys,
      totalSells,
      timeInvested,
      closedTrades: closedTrades.length,
      openTrades: openCount,
      trades,
      earningsWithoutStrategyPct: earningsWithoutStrategy * 100,
    },
  };
}
