import { checkFormValidity } from "@/util/formCheck";
import {
  candleData,
  extractTradeMarkersFromJobResult,
  getCandlestickChartData,
  getJobDataForSymbol,
  getTradeDataForStrategy,
} from "@/util/serverFetch";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  transformedData: {
    longName: string;
    symbol: string;
    candles: candleData;
  };
  runCalculation: (configOverrides: Record<string, unknown>) => Promise<void>;
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
  const [transformedData, setTransformedData] = useState<{
    longName: string;
    symbol: string;
    candles: candleData;
  }>({ longName: "", symbol: "", candles: [] });
  const [loading, setLoading] = useState(false);
  const [strategyData, setStrategyData] = useState<
    { time: number; amount: number }[]
  >([]);

  useEffect(() => {
    if (!hasParams) {
      setError("");
      setStatusMessage("");
      setConsoleOutput("");
      setStage("configuring");
      setLoading(false);
      setTransformedData({ longName: "", symbol: "", candles: [] });
      setStrategyData([]);
      return;
    }
    if (!interval || !period1 || !period2 || !symbol) {
      router.push(redirectPathOnInvalid);
    }
    const errorMsg = checkFormValidity({
      symbol: { value: symbol },
      interval: { value: interval },
      period1: { value: period1 },
      period2: { value: period2 },
      strategy: { value: strategy },
    });

    setError(errorMsg);

    if (errorMsg) {
      setTransformedData({ longName: "", symbol: "", candles: [] });
      setStrategyData([]);
      setStage("failed");
      setLoading(false);
      return; // Don't fetch invalid data
    }
    setStage("configuring");
  }, [
    hasParams,
    interval,
    period1,
    period2,
    redirectPathOnInvalid,
    router,
    strategy,
    symbol,
  ]);

  async function pollJobUntilFinished(jobId: number) {
    const timeoutMs = 60000*20;
    const pollStart = Date.now();
    while (Date.now() - pollStart < timeoutMs) {
      const job = await getJobDataForSymbol(jobId, symbol);
      if (job.error || !job.data) {
        throw new Error(job.error ?? "Unable to fetch job status.");
      }
      const jobStatus = String(job.data.status ?? "");
      setConsoleOutput(
        typeof job.data.consoleOutput === "string" ? job.data.consoleOutput : ""
      );
      setStatusMessage(`Calculation status: ${jobStatus}`);
      if (jobStatus === "completed") {
        const parsedResult =
          typeof job.data.result === "string"
            ? JSON.parse(job.data.result || "{}")
            : job.data.result;
        setStrategyData(extractTradeMarkersFromJobResult(parsedResult));
        return;
      }
      if (jobStatus === "failed") {
        throw new Error(job.data.errorMessage || "Strategy calculation failed.");
      }
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
    throw new Error("Timed out while waiting for strategy calculation.");
  }

  async function fetchCandles() {
    const data = await getCandlestickChartData({
      symbol,
      interval,
      period1,
      period2,
      strategy,
    });
    if (data.error) {
      throw new Error(data.error);
    }
    const newData = data.data as
      | {
          symbol: string;
          longName: string;
          candles: candleData;
        }
      | undefined;
    if (!newData || !newData.candles || newData.candles.length === 0) {
      throw new Error("No candlestick data found.");
    }
    const sortedAndUniqueData = newData.candles
      .sort((a, b) => Number(a.time) - Number(b.time))
      .filter(
        (candle, index, self) =>
          index === 0 || self[index - 1].time !== candle.time
      );
    setTransformedData({
      longName: newData.longName,
      symbol: newData.symbol,
      candles: sortedAndUniqueData,
    });
  }

  async function runCalculation(configOverrides: Record<string, unknown>) {
    const validationError = checkFormValidity({
      symbol: { value: symbol },
      interval: { value: interval },
      period1: { value: period1 },
      period2: { value: period2 },
      strategy: { value: strategy },
    });
    if (validationError) {
      setError(validationError);
      setStage("failed");
      return;
    }

    try {
      setLoading(true);
      setConsoleOutput("");
      setError("");
      setStatusMessage("Submitting strategy calculation...");
      setStage("submitting");
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
        await pollJobUntilFinished(start.jobId);
        await fetchCandles();
        setStatusMessage("Calculation completed.");
        setStage("success");
      } catch (e) {
        console.error(e);
        throw e;
      }
    } catch (e) {
      setStage("failed");
      setError(e instanceof Error ? e.message : "An Error occured while fetching data");
    } finally {
      setLoading(false);
    }
  }

  return {
    consoleOutput,
    error,
    loading,
    strategyData,
    transformedData,
    runCalculation,
    statusMessage,
    stage,
  };
}
