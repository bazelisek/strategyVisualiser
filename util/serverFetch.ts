// serverFetch.ts
"use server";
import { fetchChartData, transformYahooData } from "@/util/fetch";
import { ReadonlyURLSearchParams } from "next/navigation";

export async function getChartData({
  symbol,
  interval,
  duration,
  strategy,
}: {
  symbol: any;
  interval: any;
  duration: any;
  strategy: any;
}) {
  console.log("exec");

  const { data, error } = await fetchChartData(symbol, interval, duration);

  if (error) {
    return { data: [], error };
  }

  const transformedData = transformYahooData(data);
  return { data: transformedData, error: null };
}
