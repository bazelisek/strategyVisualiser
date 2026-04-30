import { candleData } from "../serverFetch";

export interface StrategyPoint {
  time: number; // UTC timestamp int
  amount: number; // >0 = buy, <0 = sell
  symbol?: string;
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

type StrategyPerformanceInput = {
  strategyData: StrategyPoint[];
  transformedData: { candles: candleData };
};

function findFirstCandleIndexAtOrAfter(
  opens: { value: number; time: number }[],
  targetTime: number,
  startIndex: number,
): number {
  let index = startIndex;
  while (index < opens.length && opens[index].time < targetTime) {
    index++;
  }
  return index < opens.length ? index : -1;
}

export function getStrategyPerformance(
  strategyData: StrategyPoint[],
  transformedData: { candles: candleData },
): StrategyPerformance {
  const opens = transformedData.candles.map((candle) => ({
    value: candle.open,
    time: Number(candle.time),
  }));

  if (strategyData.length === 0) return { error: "No buy/sell data." };
  if (opens.length === 0) return { error: "No candlestick data found." };

  const sortedStrategyData = [...strategyData].sort((a, b) => a.time - b.time);
  const buys = sortedStrategyData.filter((point) => point.amount > 0);
  const sells = sortedStrategyData.filter((point) => point.amount < 0);
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
    buyIndex = findFirstCandleIndexAtOrAfter(opens, flatBuys[i].time, buyIndex);
    if (buyIndex === -1) {
      return { error: "Candle and strategy times are not matching." };
    }
    const buyPrice = opens[buyIndex].value;

    const resolvedSellIndex = findFirstCandleIndexAtOrAfter(
      opens,
      flatSells[i].time,
      sellIndex,
    );
    if (resolvedSellIndex === -1) {
      return { error: "Candle and strategy times are not matching." };
    }

    while (sellIndex < resolvedSellIndex) {
      sellIndex++;
      if (sellIndex >= buyIndex)
        timesInvested++;
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

function getBuyAndHoldPct(candles: candleData): number {
  if (candles.length === 0) return 0;
  return ((candles[candles.length - 1].open - candles[0].open) / candles[0].open) * 100;
}

export function getAggregatedStrategyPerformance(
  inputs: StrategyPerformanceInput[],
): StrategyPerformance {
  const inputsWithCandles = inputs.filter(
    (input) => input.transformedData.candles.length > 0,
  );

  if (inputsWithCandles.length === 0) {
    return { error: "No candlestick data found." };
  }

  const trades: Trade[] = [];
  let totalBuys = 0;
  let totalSells = 0;
  let closedTrades = 0;
  let openTrades = 0;
  let timeInvestedWeighted = 0;
  let timeWeight = 0;
  let earningsWithoutStrategySum = 0;

  inputsWithCandles.forEach((input) => {
    const candleCount = input.transformedData.candles.length;
    earningsWithoutStrategySum += getBuyAndHoldPct(input.transformedData.candles);
    timeWeight += candleCount;

    if (input.strategyData.length === 0) {
      return;
    }

    const performance = getStrategyPerformance(
      input.strategyData,
      input.transformedData,
    );

    if (!performance.data) {
      return;
    }

    totalBuys += performance.data.totalBuys;
    totalSells += performance.data.totalSells;
    closedTrades += performance.data.closedTrades;
    openTrades += performance.data.openTrades;
    timeInvestedWeighted += performance.data.timeInvested * candleCount;
    trades.push(...performance.data.trades);
  });

  const rankedTrades = (closedTrades > 0 ? trades.filter((trade) => !trade.isOpen) : trades)
    .toSorted((a, b) => a.result - b.result);

  return {
    data: {
      bestTrade: rankedTrades.at(-1),
      worstTrade: rankedTrades[0],
      totalBuys,
      totalSells,
      closedTrades,
      openTrades,
      trades,
      earningsWithoutStrategyPct: earningsWithoutStrategySum / inputsWithCandles.length,
      timeInvested: timeWeight > 0 ? timeInvestedWeighted / timeWeight : 0,
    },
  };
}
