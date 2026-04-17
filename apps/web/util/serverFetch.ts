// serverFetch.ts
import { UTCTimestamp } from "lightweight-charts";
import { parseStrategyId } from "./strategies/strategyId";

export type candleData = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}[];

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
  const fromIso = new Date(period1 * 1000).toISOString().slice(0, 10);
  const toIso = new Date(period2 * 1000).toISOString().slice(0, 10);
  let yahooError: string | null = null;

  try {
    const yahooRes = await fetch(
      `/api/yahoo/${encodeURIComponent(symbol)}?interval=${encodeURIComponent(interval)}&from=${fromIso}&to=${toIso}`
    );
    if (yahooRes.ok) {
      const yahooRows = (await yahooRes.json()) as Array<{
        ticker: string;
        tradeDate: string;
        tradeTime?: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }>;
      const transformedData = transformRowsToCandles(yahooRows);
      if (transformedData.candles.length > 0) {
        return { data: transformedData, error: null };
      }
      yahooError = "No candlestick data available.";
    } else {
      yahooError = "Unable to fetch candlestick data.";
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
      candles: candles.filter((candle) => candle.time >= period1 && candle.time <= period2),
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
        symbol,
        fromDate: new Date(period1 * 1000).toISOString().slice(0, 10),
        toDate: new Date(period2 * 1000).toISOString().slice(0, 10),
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

export async function getJobDataForSymbol(jobId: number, symbol: string) {
  try {
    const response = await fetch(`/api/jobs/${jobId}?symbol=${encodeURIComponent(symbol)}`);
    if (!response.ok) {
      return { data: null, error: "Failed to fetch strategy job status." };
    }
    const data = await response.json();
    return { data, error: null };
  } catch {
    return { data: null, error: "Failed to fetch strategy job status." };
  }
}

export function extractTradeMarkersFromJobResult(
  result: unknown
): { time: number; amount: number }[] {
  if (!result || typeof result !== "object") {
    return [];
  }
  const asRecord = result as Record<string, unknown>;
  const trades = Array.isArray(asRecord.trades) ? asRecord.trades : [];
  return trades
    .map((trade) => {
      if (!trade || typeof trade !== "object") return null;
      const entry = trade as Record<string, unknown>;
      const timeRaw = entry.time;
      const amountRaw = entry.amount;
      const time = typeof timeRaw === "number" ? timeRaw : Number(timeRaw);
      const amount = typeof amountRaw === "number" ? amountRaw : Number(amountRaw);
      if (!Number.isFinite(time) || !Number.isFinite(amount)) {
        return null;
      }
      return { time, amount };
    })
    .filter((entry): entry is { time: number; amount: number } => entry !== null)
    .sort((a, b) => a.time - b.time);
}

export type searchParamsType = {
  symbol: string,
  period1: string,
  period2: string,
  interval: string,
  strategy: string
}
