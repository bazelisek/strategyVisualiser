"use server";
import { fetchChartData, transformYahooData } from "@/util/fetch";
import React from "react";
import Chart from "./Chart";

interface ChartFetcherProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

const ChartFetcher: React.FC<ChartFetcherProps> = async ({ searchParams }) => {
  const params = await searchParams;
  console.log('exec')
  const symbol = params.symbol || '';
  const interval = params.interval || '';
  const duration = params.duration || '';
  const strategy = params.strategy || '';

  const { data, error } = await fetchChartData(symbol, interval, duration);

  if (error) {
    return <p>error</p>;
  }

  const tranformedData = transformYahooData(data);

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
  return <Chart width={800} height={600} data={tranformedData} />;
};

export default ChartFetcher;
