import { candleData } from "../serverFetch";

const EPSILON = 1e-7;

export interface StrategyPoint {
  time: number;
  amount: number;
  symbol?: string;
}

export type Trade = {
  symbol?: string;
  quantity: number;
  buy: number;
  sell: number;
  buyValue: number;
  sellValue: number;
  result: number;
  buyTime: number;
  sellTime: number;
  isOpen: boolean;
};

export type SymbolContribution = {
  symbol: string;
  trades: Trade[];
  closedTrades: number;
  openTrades: number;
  totalBuyValue: number;
  totalSellValue: number;
  pnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  returnPct: number;
  contributionPct: number;
  averageInvestedPct: number;
  benchmarkPct: number;
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
    initialCash: number;
    endingCash: number;
    endingValue: number;
    pnl: number;
    totalReturnPct: number;
    totalBuyValue: number;
    totalSellValue: number;
    symbolBreakdown: Record<string, SymbolContribution>;
  };
  error?: string;
};

type StrategyPerformanceInput = {
  strategyData: StrategyPoint[];
  transformedData: { candles: candleData };
  symbol?: string;
};

type ResolvedTradeEvent = {
  symbol: string;
  time: number;
  amount: number;
  price: number;
};

type OpenLot = {
  symbol: string;
  quantity: number;
  buyPrice: number;
  buyTime: number;
};

type SimulationResult = {
  trades: Trade[];
  totalBuys: number;
  totalSells: number;
  endingCash: number;
  endingValue: number;
  closedTrades: number;
  openTrades: number;
  totalBuyValue: number;
  totalSellValue: number;
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

function normalizeSymbol(symbol?: string): string | undefined {
  if (!symbol) return undefined;
  const trimmed = symbol.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeCashBase(initialCash: number | undefined, fallbackCash: number): number {
  if (typeof initialCash === "number" && Number.isFinite(initialCash) && initialCash > 0) {
    return initialCash;
  }
  if (Number.isFinite(fallbackCash) && fallbackCash > 0) {
    return fallbackCash;
  }
  return 1;
}

function getBuyAndHoldPct(candles: candleData): number {
  if (candles.length === 0) return 0;
  return ((candles[candles.length - 1].open - candles[0].open) / candles[0].open) * 100;
}

function resolveTradeEvents(
  strategyData: StrategyPoint[],
  candles: candleData,
  fallbackSymbol?: string,
): { events: ResolvedTradeEvent[]; error?: string } {
  const opens = candles.map((candle) => ({
    value: candle.open,
    time: Number(candle.time),
  }));

  if (strategyData.length === 0) {
    return { events: [], error: "No buy/sell data." };
  }
  if (opens.length === 0) {
    return { events: [], error: "No candlestick data found." };
  }

  const sortedStrategyData = [...strategyData].sort((a, b) => a.time - b.time);
  const events: ResolvedTradeEvent[] = [];
  let candleIndex = 0;

  for (const point of sortedStrategyData) {
    if (!Number.isFinite(point.amount) || Math.abs(point.amount) <= EPSILON) {
      continue;
    }

    candleIndex = findFirstCandleIndexAtOrAfter(opens, point.time, candleIndex);
    if (candleIndex === -1) {
      return { events: [], error: "Candle and strategy times are not matching." };
    }

    const symbol = normalizeSymbol(point.symbol) ?? normalizeSymbol(fallbackSymbol);
    events.push({
      symbol: symbol ?? "",
      time: opens[candleIndex].time,
      amount: point.amount,
      price: opens[candleIndex].value,
    });
  }

  return { events };
}

function simulateTrades(
  resolvedEvents: ResolvedTradeEvent[],
  candlesBySymbol: Record<string, candleData>,
  initialCash?: number,
): { data?: SimulationResult; error?: string } {
  const sortedEvents = [...resolvedEvents].sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    if (a.symbol !== b.symbol) return a.symbol.localeCompare(b.symbol);
    // Process buys before sells at the same timestamp
    return b.amount - a.amount;
  });

  const openLots = new Map<string, OpenLot[]>();
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

  for (const event of sortedEvents) {
    const symbolLots = openLots.get(event.symbol) ?? [];
    openLots.set(event.symbol, symbolLots);

    if (event.amount > 0) {
      totalBuys++;
      const buyValue = event.amount * event.price;
      totalBuyValue += buyValue;
      cash -= buyValue;
      symbolLots.push({
        symbol: event.symbol,
        quantity: event.amount,
        buyPrice: event.price,
        buyTime: event.time,
      });
      continue;
    }

    totalSells++;
    let remaining = Math.abs(event.amount);

    while (remaining > EPSILON && symbolLots.length > 0) {
      const lot = symbolLots[0];
      const matchedQuantity = Math.min(remaining, lot.quantity);
      const sellValue = matchedQuantity * event.price;
      const buyValue = matchedQuantity * lot.buyPrice;

      trades.push({
        symbol: event.symbol || undefined,
        quantity: matchedQuantity,
        buy: lot.buyPrice,
        sell: event.price,
        buyValue,
        sellValue,
        result: sellValue - buyValue,
        buyTime: lot.buyTime,
        sellTime: event.time,
        isOpen: false,
      });

      totalSellValue += sellValue;
      cash += sellValue;
      remaining -= matchedQuantity;
      lot.quantity -= matchedQuantity;

      if (lot.quantity <= EPSILON) {
        symbolLots.shift();
      }
    }

    if (remaining > EPSILON) {
      return { error: "Sell amount exceeds the open position size." };
    }
  }

  let endingValue = cash;

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
      endingValue += sellValue;

      trades.push({
        symbol: symbol || undefined,
        quantity: lot.quantity,
        buy: lot.buyPrice,
        sell: lastPrice,
        buyValue,
        sellValue,
        result: sellValue - buyValue,
        buyTime: lot.buyTime,
        sellTime: lastTime,
        isOpen: true,
      });
    }
  });

  const closedTrades = trades.filter((trade) => !trade.isOpen).length;
  const openTrades = trades.filter((trade) => trade.isOpen).length;

  return {
    data: {
      trades,
      totalBuys,
      totalSells,
      endingCash: cash,
      endingValue,
      closedTrades,
      openTrades,
      totalBuyValue,
      totalSellValue,
    },
  };
}

function getAverageInvestedPct(
  resolvedEvents: ResolvedTradeEvent[],
  candlesBySymbol: Record<string, candleData>,
  initialCash: number,
): number {
  const allTimes = Array.from(
    new Set(
      Object.values(candlesBySymbol).flatMap((candles) =>
        candles.map((candle) => Number(candle.time)),
      ),
    ),
  ).sort((a, b) => a - b);

  if (allTimes.length === 0 || initialCash <= 0) {
    return 0;
  }

  const sortedEvents = [...resolvedEvents].sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    if (a.symbol !== b.symbol) return a.symbol.localeCompare(b.symbol);
    // Process buys before sells at the same timestamp
    return b.amount - a.amount;
  });

  const positionQuantityBySymbol = new Map<string, number>();
  const candleIndexBySymbol = new Map<string, number>();
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
      if (quantity <= EPSILON) {
        return;
      }

      investedValue += quantity * candles[candleIndex].open;
    });

    investedRatioSum += investedValue / initialCash;
  }

  return investedRatioSum / allTimes.length;
}

function buildSymbolBreakdown(
  symbols: string[],
  trades: Trade[],
  candlesBySymbol: Record<string, candleData>,
  initialCash: number,
  totalPnl: number,
  resolvedEvents: ResolvedTradeEvent[],
): Record<string, SymbolContribution> {
  const breakdown: Record<string, SymbolContribution> = {};

  for (const symbol of symbols) {
    const symbolTrades = trades.filter((trade) => trade.symbol === symbol);
    const closedTrades = symbolTrades.filter((trade) => !trade.isOpen);
    const openTrades = symbolTrades.filter((trade) => trade.isOpen);
    const totalBuyValue = symbolTrades.reduce((sum, trade) => sum + trade.buyValue, 0);
    const totalSellValue = symbolTrades.reduce((sum, trade) => sum + trade.sellValue, 0);
    const realizedPnl = closedTrades.reduce((sum, trade) => sum + trade.result, 0);
    const unrealizedPnl = openTrades.reduce((sum, trade) => sum + trade.result, 0);
    const pnl = realizedPnl + unrealizedPnl;
    const returnPct = initialCash > 0 ? (pnl / initialCash) * 100 : 0;

    breakdown[symbol] = {
      symbol,
      trades: symbolTrades,
      closedTrades: closedTrades.length,
      openTrades: openTrades.length,
      totalBuyValue,
      totalSellValue,
      pnl,
      realizedPnl,
      unrealizedPnl,
      returnPct,
      contributionPct: Math.abs(totalPnl) > EPSILON ? (pnl / totalPnl) * 100 : 0,
      averageInvestedPct: getAverageInvestedPct(
        resolvedEvents.filter((event) => event.symbol === symbol),
        { [symbol]: candlesBySymbol[symbol] ?? [] },
        initialCash,
      ),
      benchmarkPct: getBuyAndHoldPct(candlesBySymbol[symbol] ?? []),
    };
  }

  return breakdown;
}

function buildPortfolioBenchmarkPct(
  candlesBySymbol: Record<string, candleData>,
  initialCash: number,
): number {
  const symbols = Object.keys(candlesBySymbol).filter(
    (symbol) => candlesBySymbol[symbol]?.length > 0,
  );
  if (symbols.length === 0 || initialCash <= 0) {
    return 0;
  }

  const allocationPerSymbol = initialCash / symbols.length;
  let endingValue = 0;

  for (const symbol of symbols) {
    const candles = candlesBySymbol[symbol];
    const firstOpen = candles[0]?.open ?? 0;
    const lastOpen = candles[candles.length - 1]?.open ?? 0;
    if (firstOpen <= 0) {
      continue;
    }
    const shares = allocationPerSymbol / firstOpen;
    endingValue += shares * lastOpen;
  }

  return ((endingValue - initialCash) / initialCash) * 100;
}

function buildPerformanceResult(
  candlesBySymbol: Record<string, candleData>,
  resolvedEvents: ResolvedTradeEvent[],
  initialCash?: number,
): StrategyPerformance {
  const simulation = simulateTrades(resolvedEvents, candlesBySymbol, initialCash);
  if (!simulation.data) {
    return { error: simulation.error ?? "Unable to calculate strategy performance." };
  }

  const totalResolvedBuyValue = resolvedEvents
    .filter((event) => event.amount > 0)
    .reduce((sum, event) => sum + event.amount * event.price, 0);
  const cashBase = normalizeCashBase(initialCash, totalResolvedBuyValue);
  const pnl = simulation.data.endingValue - cashBase;
  const totalReturnPct = (pnl / cashBase) * 100;
  const rankedTrades = (
    simulation.data.closedTrades > 0
      ? simulation.data.trades.filter((trade) => !trade.isOpen)
      : simulation.data.trades
  ).toSorted((a, b) => a.result - b.result);

  const symbolBreakdown = buildSymbolBreakdown(
    Object.keys(candlesBySymbol),
    simulation.data.trades,
    candlesBySymbol,
    cashBase,
    pnl,
    resolvedEvents,
  );

  return {
    data: {
      bestTrade: rankedTrades.at(-1),
      worstTrade: rankedTrades[0],
      totalBuys: simulation.data.totalBuys,
      totalSells: simulation.data.totalSells,
      closedTrades: simulation.data.closedTrades,
      openTrades: simulation.data.openTrades,
      trades: simulation.data.trades,
      earningsWithoutStrategyPct: buildPortfolioBenchmarkPct(candlesBySymbol, cashBase),
      timeInvested: getAverageInvestedPct(resolvedEvents, candlesBySymbol, cashBase),
      initialCash: cashBase,
      endingCash: simulation.data.endingCash,
      endingValue: simulation.data.endingValue,
      pnl,
      totalReturnPct,
      totalBuyValue: simulation.data.totalBuyValue,
      totalSellValue: simulation.data.totalSellValue,
      symbolBreakdown,
    },
  };
}

export function getStrategyPerformance(
  strategyData: StrategyPoint[],
  transformedData: { candles: candleData },
  options?: { initialCash?: number; symbol?: string },
): StrategyPerformance {
  const resolved = resolveTradeEvents(
    strategyData,
    transformedData.candles,
    options?.symbol,
  );

  if (resolved.error) {
    return { error: resolved.error };
  }

  if (transformedData.candles.length === 0) {
    return { error: "No candlestick data found." };
  }

  const symbolKey = normalizeSymbol(options?.symbol) ?? "current";

  return buildPerformanceResult(
    { [symbolKey]: transformedData.candles },
    resolved.events.map((event) => ({ ...event, symbol: symbolKey })),
    options?.initialCash,
  );
}

export function getAggregatedStrategyPerformance(
  inputs: StrategyPerformanceInput[],
  initialCash?: number,
): StrategyPerformance {
  const candlesBySymbol: Record<string, candleData> = {};
  const resolvedEvents: ResolvedTradeEvent[] = [];
  let hasTrades = false;

  for (const input of inputs) {
    const symbol =
      normalizeSymbol(input.symbol) ??
      normalizeSymbol(input.strategyData.find((point) => point.symbol)?.symbol) ??
      "";

    if (!symbol) {
      continue;
    }

    if (input.transformedData.candles.length > 0) {
      candlesBySymbol[symbol] = input.transformedData.candles;
    }

    if (input.strategyData.length === 0) {
      continue;
    }

    const resolved = resolveTradeEvents(
      input.strategyData.map((point) => ({ ...point, symbol })),
      input.transformedData.candles,
      symbol,
    );

    if (resolved.error && resolved.error !== "No buy/sell data.") {
      return { error: resolved.error };
    }

    if (resolved.events.length > 0) {
      hasTrades = true;
      resolvedEvents.push(...resolved.events);
    }
  }

  if (Object.keys(candlesBySymbol).length === 0) {
    return { error: "No candlestick data found." };
  }

  if (!hasTrades) {
    return buildPerformanceResult(candlesBySymbol, [], initialCash);
  }

  return buildPerformanceResult(candlesBySymbol, resolvedEvents, initialCash);
}
