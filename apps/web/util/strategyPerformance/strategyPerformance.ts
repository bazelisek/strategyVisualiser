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
};

export function getStrategyPerformance(
  strategyData: StrategyPoint[],
  transformedData: { candles: candleData },
): {
  data?: {
    bestTrade: Trade;
    worstTrade: Trade;
    totalBuys: number;
    totalSells: number;
    trades: Trade[];
  };
  error?: string;
} {
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
  const totalBuys = flatBuys.length;
  const totalSells = flatSells.length;

  if (totalBuys !== totalSells) {
    return { error: "Buy amount is not equal to the sell amount." };
  }

  const trades: {
    buy: number;
    sell: number;
    result: number;
    buyTime: number;
    sellTime: number;
  }[] = [];
  let buyIndex = 0;
  let sellIndex = 0;
  for (let i = 0; i < totalBuys; i++) {
    while (buyIndex < opens.length-1 && opens[buyIndex].time < flatBuys[i].time) {
      buyIndex++;
    }
    if (buyIndex < opens.length) {
      console.log("flatBuys: " + flatBuys[i].time);
      console.log("opens(buy): " + opens[buyIndex].time);
    }

    if (buyIndex >= opens.length || opens[buyIndex].time !== flatBuys[i].time) {
      console.error("MISMATCH: " + opens[buyIndex].time + ", " + flatBuys[i].time);
      return { error: "Candle and strategy times are not matching." };
    }
    const buyPrice = opens[buyIndex].value;

    while (opens[sellIndex].time < flatSells[i].time) {
      sellIndex++;
    }
    if (sellIndex < opens.length) {
      console.log("flatSells: " + flatSells[i].time);
      console.log("opens(sell): " + opens[sellIndex].time);
    }
    if (opens[sellIndex].time !== flatSells[i].time) {
      console.error("MISMATCH: " + opens[sellIndex].time + ", " + flatSells[i].time);
      return { error: "Candle and strategy times are not matching." };
    }
    const sellPrice = opens[sellIndex].value;
    trades.push({
      buy: buyPrice,
      sell: sellPrice,
      result: sellPrice - buyPrice,
      buyTime: opens[buyIndex].time,
      sellTime: opens[sellIndex].time,
    });
  }

  const sortedTrades = trades.sort((a, b) => a.result - b.result);
  const bestTrade: Trade | undefined = sortedTrades.at(-1);
  const worstTrade: Trade | undefined = sortedTrades[0];
  if (!bestTrade || !worstTrade) return { error: "Trades not found" };

  //fetch('http://DUMMYURL/strategyPerformance')
  return { data: { bestTrade, worstTrade, totalBuys, totalSells, trades } };
}
