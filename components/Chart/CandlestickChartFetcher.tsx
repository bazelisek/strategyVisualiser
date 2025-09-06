"use client";
import React, { useEffect, useState } from "react";
import Chart from "./Chart";
import { getCandlestickChartData } from "@/util/serverFetch";
import { useSearchParams } from "next/navigation";
import CandlestickChart from "./CandlestickChart";

interface CandlestickChartFetcherProps {
  //searchParams: Promise<{ [key: string]: string | undefined }>;
}

const CandlestickChartFetcher: React.FC<CandlestickChartFetcherProps> = (props) => {
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
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function handleGetChartData() {
      const data = await getCandlestickChartData({
        symbol,
        interval,
        duration,
        strategy,
      });
      if (data.error) {
        return <p>{data.error}</p>;
      } else {
        setTransformedData(data.data);
      }
      setLoading(false);
    }
    setLoading(true);
    handleGetChartData();
  }, [searchParams]);

  //setData(data);
  //console.log(data);

  /*const dummydata = [
    { time: "2019-04-11", value: 80.01 },
    { time: "2019-04-12", value: 96.63 },
    { time: "2019-04-13", value: 76.64 },
    { time: "2019-04-14", value: 81.89 },
    { time: "2019-04-15", value: 74.43 },
    { time: "2019-04-16", value: 80.01 },
    { time: "2019-04-17", value: 96.63 },
    { time: "2019-04-18", value: 76.64 },
    { time: "2019-04-19", value: 81.89 },
    { time: "2019-04-20", value: 74.43 },
  ];*/
  return (
    <>
      {loading && <p>Loading...</p>}
      {!loading && (
        <CandlestickChart width={800} height={600} candles={transformedData} />
      )}
    </>
  );
};

export default CandlestickChartFetcher;
