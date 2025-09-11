import { checkFormValidity } from "@/util/formCheck";
import {
  getCandlestickChartData,
  getTradeDataForStrategy,
} from "@/util/serverFetch";
import { getTradeMarkers } from "@/util/util";
import { SeriesMarker, Time } from "lightweight-charts";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useChartData(
  {
    symbol,
    interval,
    period1,
    period2,
    strategy,
  }: {
    symbol: string;
    interval: string;
    period2: string;
    period1: string;
    strategy: string;
  },
  redirectPathOnInvalid: string
): {
  error: string;
  strategyData: { time: number; amount: number }[];
  loading: boolean;
  transformedData: {
    longName: string;
    symbol: string;
    candles: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
    }[];
  };
} {
  const router = useRouter();
  const [error, setError] = useState("");
  const [transformedData, setTransformedData] = useState<{
    longName: string;
    symbol: string;
    candles: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
    }[];
  }>({ longName: "", symbol: "", candles: [] });
  const [loading, setLoading] = useState(true);
  const [strategyData, setStrategyData] = useState<
    { time: number; amount: number }[]
  >([]);

  useEffect(() => {
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
      setLoading(false);
      return; // Don't fetch invalid data
    }

    async function handleGetChartData() {
      try {
        const data = await getCandlestickChartData({
          symbol,
          interval,
          period1,
          period2,
          strategy,
        });
        if (data.error) {
          throw new Error(data.error);
        } else {
          const newData = data.data as
            | {
                symbol: string;
                longName: string;
                candles: {
                  time: number;
                  open: number;
                  high: number;
                  low: number;
                  close: number;
                }[];
              }
            | undefined;

          // Guard against missing candles
          if (!newData || !newData.candles || newData.candles.length === 0) {
            throw new Error("No candlestick data found.");
          }

          // Sort by time and remove duplicates
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
      } catch (e) {
        console.error(e);
        throw new Error("An Error occured while fetching data");
      } finally {
        await handleGetTradeMarkers();
        setLoading(false);
      }
    }
    async function handleGetTradeMarkers() {
      try {
        const data = await getTradeDataForStrategy({
          symbol,
          interval,
          period1,
          period2,
          strategy,
        });
        if (data.error) setError(data.error);
        else {
          setStrategyData(data.data);
        }
      } catch (e) {
        console.error(e);
        throw new Error("An error occurred while fetching trade markers.");
        setError("An error occurred while fetching trade markers.");
      }
    }

    setLoading(true);
    handleGetChartData();
  }, [symbol, interval, period1, period2, strategy]);

  return { error, loading, strategyData, transformedData };
}
