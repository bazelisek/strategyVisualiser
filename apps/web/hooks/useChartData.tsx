import { checkFormValidity } from "@/util/formCheck";
import {
  candleData,
  extractTradeMarkersFromJobResult,
  getCandlestickChartData,
  getJobDataForSymbol,
  getTradeDataForStrategy,
} from "@/util/serverFetch";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type TransformedChartData = {
  longName: string;
  symbol: string;
  candles: candleData;
};

const EMPTY_CHART_DATA: TransformedChartData = {
  longName: "",
  symbol: "",
  candles: [],
};

function hasUniverseSelection(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.some((item) => typeof item === "string" && item.trim().length > 0)
  );
}

export function useChartData(
  params:
    | {
        symbol: string;
        interval: string;
        period2: number;
        period1: number;
        strategy: string;
      }
    | null,
  redirectPathOnInvalid: string
): {
  consoleOutput: string;
  error: string;
  statusMessage: string;
  stage: "configuring" | "submitting" | "running" | "success" | "failed";
  strategyData: { time: number; amount: number }[];
  loading: boolean;
  chartLoading: boolean;
  transformedData: TransformedChartData;
  jobResult: unknown;
  lastRunConfig: Record<string, unknown>;
  runCalculation: (configOverrides: Record<string, unknown>) => Promise<void>;
  loadCandlesForSymbols: (
    symbols: string[],
  ) => Promise<Record<string, TransformedChartData>>;
} {
  const symbol = params?.symbol ?? "";
  const interval = params?.interval ?? "";
  const period1 = params?.period1 ?? 0;
  const period2 = params?.period2 ?? 0;
  const strategy = params?.strategy ?? "";
  const hasParams = params !== null;
  const router = useRouter();
  const [consoleOutput, setConsoleOutput] = useState("");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [stage, setStage] = useState<
    "configuring" | "submitting" | "running" | "success" | "failed"
  >("configuring");
  const [transformedData, setTransformedData] =
    useState<TransformedChartData>(EMPTY_CHART_DATA);
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [strategyData, setStrategyData] = useState<
    { time: number; amount: number }[]
  >([]);
  const [jobResult, setJobResult] = useState<unknown>(null);
  const [lastRunConfig, setLastRunConfig] = useState<Record<string, unknown>>({});
  const candlesBySymbolRef = useRef<Record<string, TransformedChartData>>({});
  const pendingCandlesRef = useRef<Record<string, Promise<TransformedChartData>>>(
    {},
  );
  const configKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasParams) {
      setError("");
      setStatusMessage("");
      setConsoleOutput("");
      setStage("configuring");
      setLoading(false);
      setChartLoading(false);
      setTransformedData(EMPTY_CHART_DATA);
      setStrategyData([]);
      setJobResult(null);
      setLastRunConfig({});
      candlesBySymbolRef.current = {};
      pendingCandlesRef.current = {};
      return;
    }

    if (!interval || !period1 || !period2 || !strategy) {
      router.push(redirectPathOnInvalid);
    }

    const errorMsg = checkFormValidity(
      {
        symbol: { value: symbol },
        interval: { value: interval },
        period1: { value: period1 },
        period2: { value: period2 },
        strategy: { value: strategy },
      },
      { requireSymbol: false },
    );

    setError(errorMsg);

    if (errorMsg) {
      setTransformedData(EMPTY_CHART_DATA);
      setStrategyData([]);
      setStage("failed");
      setLoading(false);
      setChartLoading(false);
      return;
    }

    if (!jobResult) {
      setStage("configuring");
    }
  }, [
    hasParams,
    interval,
    jobResult,
    period1,
    period2,
    redirectPathOnInvalid,
    router,
    strategy,
    symbol,
  ]);

  useEffect(() => {
    const configKey =
      hasParams ? `${interval}|${period1}|${period2}|${strategy}` : null;

    if (configKeyRef.current === configKey) {
      return;
    }

    configKeyRef.current = configKey;
    setError("");
    setStatusMessage("");
    setConsoleOutput("");
    setStage("configuring");
    setLoading(false);
    setChartLoading(false);
    setStrategyData([]);
    setTransformedData(EMPTY_CHART_DATA);
    setJobResult(null);
    setLastRunConfig({});
    candlesBySymbolRef.current = {};
    pendingCandlesRef.current = {};
  }, [hasParams, interval, period1, period2, strategy]);

  const loadCandlesForSymbols = useCallback(
    async (symbolsToLoad: string[]) => {
      const uniqueSymbols = Array.from(
        new Set(
          symbolsToLoad
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
        ),
      );

      if (uniqueSymbols.length === 0) {
        return {} as Record<string, TransformedChartData>;
      }

      const entries = await Promise.all(
        uniqueSymbols.map(async (item) => {
          const cached = candlesBySymbolRef.current[item];
          if (cached) {
            return [item, cached] as const;
          }

          if (!pendingCandlesRef.current[item]) {
            pendingCandlesRef.current[item] = (async () => {
              const data = await getCandlestickChartData({
                symbol: item,
                interval,
                period1,
                period2,
                strategy,
              });
              if (data.error) {
                throw new Error(data.error);
              }

              const nextData = data.data as TransformedChartData | undefined;
              if (
                !nextData ||
                !nextData.candles ||
                nextData.candles.length === 0
              ) {
                throw new Error(`No candlestick data found for ${item}.`);
              }

              return {
                longName: nextData.longName,
                symbol: nextData.symbol,
                candles: nextData.candles
                  .sort((a, b) => Number(a.time) - Number(b.time))
                  .filter(
                    (candle, index, self) =>
                      index === 0 || self[index - 1].time !== candle.time,
                  ),
              };
            })()
              .then((resolved) => {
                candlesBySymbolRef.current[item] = resolved;
                return resolved;
              })
              .finally(() => {
                delete pendingCandlesRef.current[item];
              });
          }

          const resolved = await pendingCandlesRef.current[item];
          candlesBySymbolRef.current[item] = resolved;
          return [item, resolved] as const;
        }),
      );

      return Object.fromEntries(entries);
    },
    [interval, period1, period2, strategy],
  );

  async function pollJobUntilFinished(jobId: number) {
    const timeoutMs = 60000 * 20;
    const pollStart = Date.now();
    while (Date.now() - pollStart < timeoutMs) {
      const job = await getJobDataForSymbol(jobId);
      if (job.error || !job.data) {
        throw new Error(job.error ?? "Unable to fetch job status.");
      }
      const jobStatus = String(job.data.status ?? "");
      setConsoleOutput(
        typeof job.data.consoleOutput === "string" ? job.data.consoleOutput : "",
      );
      setStatusMessage(`Calculation status: ${jobStatus}`);
      if (jobStatus === "completed") {
        return typeof job.data.result === "string"
          ? JSON.parse(job.data.result || "{}")
          : (job.data.result ?? {});
      }
      if (jobStatus === "failed") {
        throw new Error(job.data.errorMessage || "Strategy calculation failed.");
      }
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
    throw new Error("Timed out while waiting for strategy calculation.");
  }

  useEffect(() => {
    if (stage !== "success" || !jobResult) {
      if (stage !== "submitting" && stage !== "running") {
        setChartLoading(false);
      }
      return;
    }

    if (!symbol) {
      setStrategyData([]);
      setTransformedData(EMPTY_CHART_DATA);
      setChartLoading(false);
      return;
    }

    let isActive = true;

    setStrategyData(extractTradeMarkersFromJobResult(jobResult, symbol));
    const cached = candlesBySymbolRef.current[symbol];
    if (cached) {
      setTransformedData(cached);
      setChartLoading(false);
      return () => {
        isActive = false;
      };
    }

    setTransformedData(EMPTY_CHART_DATA);
    setChartLoading(true);

    void loadCandlesForSymbols([symbol])
      .then((loaded) => {
        if (!isActive) return;
        const nextData = loaded[symbol];
        if (!nextData) {
          throw new Error(`No candlestick data found for ${symbol}.`);
        }
        setTransformedData(nextData);
      })
      .catch((nextError) => {
        if (!isActive) return;
        setStage("failed");
        setError(
          nextError instanceof Error
            ? nextError.message
            : "An Error occured while fetching data",
        );
      })
      .finally(() => {
        if (isActive) {
          setChartLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [jobResult, loadCandlesForSymbols, stage, symbol]);

  async function runCalculation(configOverrides: Record<string, unknown>) {
    const validationError = checkFormValidity(
      {
        symbol: { value: symbol },
        interval: { value: interval },
        period1: { value: period1 },
        period2: { value: period2 },
        strategy: { value: strategy },
      },
      { requireSymbol: false },
    );
    if (validationError) {
      setError(validationError);
      setStage("failed");
      return;
    }

    if (!symbol && !hasUniverseSelection(configOverrides.universe)) {
      setError("Select a current stock or add at least one stock to the universe.");
      setStage("failed");
      return;
    }

    try {
      setLoading(true);
      setChartLoading(false);
      setConsoleOutput("");
      setError("");
      setStatusMessage("Submitting strategy calculation...");
      setStage("submitting");
      setStrategyData([]);
      setTransformedData(EMPTY_CHART_DATA);
      setJobResult(null);
      setLastRunConfig({});
      candlesBySymbolRef.current = {};
      pendingCandlesRef.current = {};
      try {
        const start = await getTradeDataForStrategy({
          symbol,
          period1,
          period2,
          strategy,
          config: configOverrides,
        });
        if (start.error || !start.jobId) {
          throw new Error(start.error ?? "Unable to start strategy calculation.");
        }
        setStage("running");
        const parsedResult = await pollJobUntilFinished(start.jobId);
        setJobResult(parsedResult);
        setLastRunConfig(configOverrides);
        setStatusMessage("Calculation completed.");
        setStage("success");
      } catch (e) {
        console.error(e);
        throw e;
      }
    } catch (e) {
      setStage("failed");
      setError(
        e instanceof Error ? e.message : "An Error occured while fetching data",
      );
    } finally {
      setLoading(false);
    }
  }

  return {
    consoleOutput,
    error,
    loading,
    chartLoading,
    strategyData,
    transformedData,
    runCalculation,
    statusMessage,
    stage,
    jobResult,
    lastRunConfig,
    loadCandlesForSymbols,
  };
}
