import { candleData } from "../serverFetch";

export interface StrategyPoint {
  time: number;
  amount: number;
  symbol?: string;
  price?: number;
}

export interface EquityPoint {
  time: number;
  value: number;
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
    equityCurve: EquityPoint[];
  };
  error?: string;
};

export type StrategyPerformanceInput = {
  strategyData: StrategyPoint[];
  transformedData: { candles: candleData };
  symbol?: string;
};

export type ResolvedTradeEvent = {
  symbol: string;
  time: number;
  amount: number;
  price: number;
};

export type OpenLot = {
  symbol: string;
  quantity: number;
  buyPrice: number;
  buyTime: number;
};

export type SimulationResult = {
  trades: Trade[];
  totalBuys: number;
  totalSells: number;
  endingCash: number;
  endingValue: number;
  closedTrades: number;
  openTrades: number;
  totalBuyValue: number;
  totalSellValue: number;
  equityCurve: EquityPoint[];
};
