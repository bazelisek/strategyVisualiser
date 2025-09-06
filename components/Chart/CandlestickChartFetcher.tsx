"use client";
import React, { useEffect, useState } from "react";
import { getCandlestickChartData, getTradeMarkers } from "@/util/serverFetch";
import { useSearchParams } from "next/navigation";
import CandlestickChart from "./CandlestickChart";
import { SeriesMarker, Time } from "lightweight-charts";
import { checkFormValidity } from "@/util/formCheck";

interface CandlestickChartFetcherProps {
  //searchParams: Promise<{ [key: string]: string | undefined }>;
}

const CandlestickChartFetcher: React.FC<CandlestickChartFetcherProps> = (
  props
) => {
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol") || "";
  const interval = searchParams.get("interval") || "";
  const duration = searchParams.get("duration") || "";
  const strategy = searchParams.get("strategy") || "";

  const [transformedData, setTransformedData] = useState<
    {
      time: string;
      open: number;
      high: number;
      low: number;
      close: number;
    }[]
  >([]);
  const [tradeMarkers, setTradeMarkers] = useState<SeriesMarker<Time>[]>([]);
  const [loadingCount, setLoadingCount] = useState(2);
  const loading = loadingCount > 0;

  useEffect(() => {
    const errorMsg = checkFormValidity({
      symbol: { value: symbol, timeout: true },
      interval: { value: interval, timeout: true },
      duration: { value: duration, timeout: true },
      strategy: { value: strategy, timeout: true },
    });

    setError(errorMsg);

    if (errorMsg) {
      setTransformedData([]);
      setTradeMarkers([]);
      setLoadingCount(0);
      return; // Don't fetch invalid data
    }

    async function handleGetChartData() {
      try {
        const data = await getCandlestickChartData({
          symbol,
          interval,
          duration,
          strategy,
        });
        if (data.error) {
          setError(data.error);
        } else {
          // Sort by time and remove duplicates to prevent chart errors
          const sortedAndUniqueData = data.data
            .sort((a, b) => Number(a.time) - Number(b.time))
            .filter(
              (candle, index, self) =>
                index === 0 || self[index - 1].time !== candle.time
            );
          setTransformedData(sortedAndUniqueData);
        }
      } catch (e) {
        setError("An error occurred while fetching chart data.");
        console.error(e);
      } finally {
        setLoadingCount((old) => old - 1);
      }
    }

    async function handleGetTradeMarkers() {
      try {
        const data = await getTradeMarkers({
          symbol,
          interval,
          duration,
          strategy,
        });
        if (data.error) setError(data.error);
        else setTradeMarkers(data.data);
      } catch (e) {
        setError("An error occurred while fetching trade markers.");
        console.error(e);
      } finally {
        setLoadingCount((old) => old - 1);
      }
    }

    setLoadingCount(2);
    handleGetChartData();
    handleGetTradeMarkers();
  }, [symbol, interval, duration, strategy]);

  return (
    <>
      {loading && !error && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && (
        <CandlestickChart
          width={1060}
          height={580}
          candles={transformedData}
          tradeMarkers={tradeMarkers}
        />
      )}
    </>
  );
};

export default CandlestickChartFetcher;
