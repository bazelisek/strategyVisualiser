import { candleData } from "../serverFetch";
import {
  StrategyPoint,
  StrategyPerformance,
  StrategyPerformanceInput,
  ResolvedTradeEvent,
  Trade,
  SymbolContribution,
} from "./types";
import {
  EPSILON,
  findFirstCandleIndexAtOrAfter,
  normalizeSymbol,
  normalizeCashBase,
} from "./utils";
import { simulateTrades } from "./simulation";
import { getAverageInvestedPct, getBuyAndHoldPct } from "./metrics";

export * from "./types";

function resolveTradeEvents(
  strategyData: StrategyPoint[],
  candles: candleData,
  fallbackSymbol?: string,
): { events: ResolvedTradeEvent[]; error?: string } {
  const opens = candles.map((candle) => ({
    value: candle.open,
    time: Number(candle.time),
  }));

  const candleMap = new Map(candles.map((c) => [Number(c.time), c]));

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
      return {
        events: [],
        error: "Candle and strategy times are not matching.",
      };
    }

    const symbol =
      normalizeSymbol(point.symbol) ?? normalizeSymbol(fallbackSymbol);
    const price =
      point.price !== undefined && Number.isFinite(point.price)
        ? point.price
        : opens[candleIndex].value;

    events.push({
      symbol: symbol ?? "",
      time: opens[candleIndex].time,
      amount: point.amount,
      price: price,
    });
  }

  return { events };
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

function buildSymbolBreakdown(
  symbols: string[],
  trades: Trade[],
  candlesBySymbol: Record<string, candleData>,
  initialCash: number,
  totalPnl: number,
  resolvedEvents: ResolvedTradeEvent[],
  equityCurve: EquityPoint[],
): Record<string, SymbolContribution> {
  const breakdown: Record<string, SymbolContribution> = {};

  for (const symbol of symbols) {
    const symbolTrades = trades.filter((trade) => trade.symbol === symbol);
    const closedTrades = symbolTrades.filter((trade) => !trade.isOpen);
    const openTrades = symbolTrades.filter((trade) => trade.isOpen);
    const totalBuyValue = symbolTrades.reduce(
      (sum, trade) => sum + trade.buyValue,
      0,
    );
    const totalSellValue = symbolTrades.reduce(
      (sum, trade) => sum + trade.sellValue,
      0,
    );
    const realizedPnl = closedTrades.reduce(
      (sum, trade) => sum + trade.result,
      0,
    );
    const unrealizedPnl = openTrades.reduce(
      (sum, trade) => sum + trade.result,
      0,
    );
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
        equityCurve,
      ),
      benchmarkPct: getBuyAndHoldPct(candlesBySymbol[symbol] ?? []),
    };
  }

  return breakdown;
}

function buildPerformanceResult(
  candlesBySymbol: Record<string, candleData>,
  resolvedEvents: ResolvedTradeEvent[],
  initialCash?: number,
): StrategyPerformance {
  const simulation = simulateTrades(
    resolvedEvents,
    candlesBySymbol,
    initialCash,
  );
  if (!simulation.data) {
    return {
      error: simulation.error ?? "Unable to calculate strategy performance.",
    };
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
    simulation.data.equityCurve,
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
      earningsWithoutStrategyPct: buildPortfolioBenchmarkPct(
        candlesBySymbol,
        cashBase,
      ),
      timeInvested: getAverageInvestedPct(
        resolvedEvents,
        candlesBySymbol,
        cashBase,
        simulation.data.equityCurve,
      ),
      initialCash: cashBase,
      endingCash: simulation.data.endingCash,
      endingValue: simulation.data.endingValue,
      pnl,
      totalReturnPct,
      totalBuyValue: simulation.data.totalBuyValue,
      totalSellValue: simulation.data.totalSellValue,
      symbolBreakdown,
      equityCurve: simulation.data.equityCurve,
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
      normalizeSymbol(
        input.strategyData.find((point) => point.symbol)?.symbol,
      ) ??
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
