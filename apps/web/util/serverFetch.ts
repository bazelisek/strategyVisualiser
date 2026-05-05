// serverFetch.ts
import { UTCTimestamp } from "lightweight-charts";
import { parseStrategyId } from "./strategies/strategyId";
import { formatLocalDate } from "./time";

export type candleData = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}[];

export type StrategyTradePoint = {
  time: number;
  amount: number;
  symbol?: string;
};

export async function getCandlestickChartData({
  symbol,
  interval,
  period1,
  period2,
}: {
  symbol: string;
  interval: string;
  period1: number;
  period2: number;
  strategy: string;
}) {
  const fromIso = formatLocalDate(period1);
  const toIso = formatLocalDate(period2);
  let yahooError: string | null = null;

  try {
    const yahooRes = await fetch(
      `/api/yahoo/${encodeURIComponent(symbol)}?interval=${encodeURIComponent(interval)}&from=${fromIso}&to=${toIso}`
    );
    const yahooPayload = (await yahooRes.json().catch(() => null)) as
      | Array<{
          ticker: string;
          tradeDate: string;
          tradeTime?: string;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
        }>
      | { error?: string }
      | null;
    if (yahooRes.ok) {
      const yahooRows = Array.isArray(yahooPayload) ? yahooPayload : [];
      const transformedData = transformRowsToCandles(yahooRows);
      if (transformedData.candles.length > 0) {
        return { data: transformedData, error: null };
      }
      yahooError = "No candlestick data available.";
    } else {
      yahooError =
        yahooPayload && !Array.isArray(yahooPayload) && yahooPayload.error
          ? yahooPayload.error
          : "Unable to fetch candlestick data.";
    }
  } catch {
    // Fall back to imported backend data below.
    yahooError = "Unable to fetch candlestick data.";
  }

  try {
    const backendRes = await fetch(
      `/api/stocks/${encodeURIComponent(symbol)}?period=D&from=${fromIso}&to=${toIso}`
    );
    if (!backendRes.ok) {
      return {
        data: { symbol: "", longName: "", candles: [] },
        error: yahooError ?? "Unable to fetch candlestick data.",
      };
    }
      const backendRows = (await backendRes.json()) as Array<{
        ticker: string;
        tradeDate: string;
      tradeTime?: string;
      open: number;
      high: number;
      low: number;
        close: number;
        volume: number;
      }>;
      const transformedData = transformRowsToCandles(backendRows);
    if (transformedData.candles.length === 0) {
      return {
        data: transformedData,
        error: "No candlestick data available.",
      };
    }
    return { data: transformedData, error: null };
  } catch {
    return {
      data: { symbol: "", longName: "", candles: [] },
      error: "Unable to fetch candlestick data.",
    };
  }

  function transformRowsToCandles(
    rows: Array<{
      ticker: string;
      tradeDate: string;
      tradeTime?: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>
  ): {
    symbol: string;
    longName: string;
    candles: candleData;
  } {
    const candles = rows
      .map((row) => {
        const iso = `${row.tradeDate}T${(row.tradeTime ?? "00:00:00").slice(0, 8)}Z`;
        const ts = Math.floor(new Date(iso).getTime() / 1000);
        return {
          time: ts as UTCTimestamp,
          open: Number(row.open),
          high: Number(row.high),
          low: Number(row.low),
          close: Number(row.close),
          volume: Number(row.volume),
        };
      })
      .filter((candle) => Number.isFinite(candle.time))
      .sort((a, b) => Number(a.time) - Number(b.time));

    return {
      symbol,
      longName: symbol,
      candles: candles,
    };
  }
}

export async function getTradeDataForStrategy({
  symbol,
  period1,
  period2,
  strategy,
  config,
}: {
  symbol: string;
  period1: number;
  period2: number;
  strategy: string;
  config: Record<string, unknown>;
}) {
  const strategyId = parseStrategyId(strategy);
  if (!strategyId) {
    return { data: [], jobId: null, status: "failed", error: "Invalid strategy." };
  }

  try {
    const analyzeRes = await fetch(`/api/strategies/${strategyId}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(symbol ? { symbol } : {}),
        fromDate: formatLocalDate(period1),
        toDate: formatLocalDate(period2),
        config,
      }),
    });
    const analyzeJson = await analyzeRes.json();
    if (!analyzeRes.ok || !analyzeJson?.job_id) {
      return {
        data: [],
        jobId: null,
        status: "failed",
        error: analyzeJson?.error ?? "Unable to start strategy calculation.",
      };
    }
    return { data: [], jobId: Number(analyzeJson.job_id), status: "accepted", error: null };
  } catch {
    return { data: [], jobId: null, status: "failed", error: "Unable to start strategy calculation." };
  }
}

export async function getJobDataForSymbol(jobId: number, symbol?: string) {
  try {
    const qs = new URLSearchParams();
    if (symbol?.trim()) {
      qs.set("symbol", symbol.trim());
    }
    const response = await fetch(
      `/api/jobs/${jobId}${qs.size > 0 ? `?${qs.toString()}` : ""}`
    );
    if (!response.ok) {
      return { data: null, error: "Failed to fetch strategy job status." };
    }
    const data = await response.json();
    return { data, error: null };
  } catch {
    return { data: null, error: "Failed to fetch strategy job status." };
  }
}

function getTradeSymbol(entry: Record<string, unknown>): string | undefined {
  const candidates = [entry.symbol, entry.ticker, entry.instrument];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return undefined;
}

export function extractTradePointsFromJobResult(
  result: unknown,
  symbol?: string
): StrategyTradePoint[] {
  if (!result || typeof result !== "object") {
    return [];
  }
  const asRecord = result as Record<string, unknown>;
  const trades = Array.isArray(asRecord.trades) ? asRecord.trades : [];
  const normalizedSymbol = symbol?.trim();
  return trades
    .map<StrategyTradePoint | null>((trade) => {
      if (!trade || typeof trade !== "object") return null;
      const entry = trade as Record<string, unknown>;
      const timeRaw = entry.time;
      const amountRaw = entry.amount;
      const priceRaw = entry.price;
      const tradeSymbol = getTradeSymbol(entry);
      const time = typeof timeRaw === "number" ? timeRaw : Number(timeRaw);
      const amount = typeof amountRaw === "number" ? amountRaw : Number(amountRaw);
      const price = typeof priceRaw === "number" ? priceRaw : Number(priceRaw);
      if (!Number.isFinite(time) || !Number.isFinite(amount)) {
        return null;
      }
      if (
        normalizedSymbol &&
        tradeSymbol &&
        tradeSymbol.toUpperCase() !== normalizedSymbol.toUpperCase()
      ) {
        return null;
      }
      return { 
        time, 
        amount, 
        symbol: tradeSymbol, 
        price: Number.isFinite(price) ? price : undefined 
      };
    })
    .filter((entry): entry is StrategyTradePoint => entry !== null)
    .sort((a, b) => a.time - b.time);
}

export function extractTradeMarkersFromJobResult(
  result: unknown,
  symbol?: string
): { time: number; amount: number }[] {
  return extractTradePointsFromJobResult(result, symbol).map(({ time, amount }) => ({
    time,
    amount,
  }));
}

export function extractSymbolsFromJobResult(result: unknown): string[] {
  const seen = new Set<string>();
  const symbols: string[] = [];
  extractTradePointsFromJobResult(result).forEach((trade) => {
    if (!trade.symbol) return;
    if (seen.has(trade.symbol)) return;
    seen.add(trade.symbol);
    symbols.push(trade.symbol);
  });
  return symbols;
}

export type searchParamsType = {
  symbol: string,
  period1: string,
  period2: string,
  interval: string,
  strategy: string
}
