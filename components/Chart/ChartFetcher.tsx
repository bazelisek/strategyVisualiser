"use client";
import React, { useEffect, useState } from "react";
import Chart from "./Chart";
import { getChartData } from "@/util/serverFetch";
import { useSearchParams } from "next/navigation";

interface ChartFetcherProps {
  //searchParams: Promise<{ [key: string]: string | undefined }>;
}

const ChartFetcher: React.FC<ChartFetcherProps> = (props) => {
  const searchParams = useSearchParams();
  const symbol = searchParams.get('symbol') || '';
  const interval = searchParams.get('interval') || '';
  const duration = searchParams.get('duration') || '';
  const strategy = searchParams.get('strategy') || '';
  
  const [transformedData, setTransformedData] = useState<
    { time: string; value: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function handleGetChartData() {
      const data = await getChartData({symbol, interval, duration, strategy});
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
      {!loading && <Chart width={800} height={600} data={transformedData} />}
    </>
  );
};

export default ChartFetcher;
