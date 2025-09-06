// serverFetch.ts
"use server";
import { fetchDataFromUrl, transformYahooToCandles } from "@/util/fetch";
import { SeriesMarker, Time } from "lightweight-charts";

export async function getCandlestickChartData({
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

  const { data, error } = await fetchDataFromUrl(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${duration}`
  );
  //const { data, error } = await fetchChartData(symbol, interval, duration);
  //console.log(JSON.stringify(data));

  if (error) {
    return { data: {symbol: '', longName: '', candles: []}, error };
  }

  const transformedData = transformYahooToCandles(data);
  console.log(transformedData);
  return { data: transformedData, error: null };
}

export async function getTradeMarkers(fetchData: {
  symbol: string;
  interval: string;
  duration: string;
  strategy: string;
}) {
  /*
  const { data, error } = await fetchDataFromUrl(
    `https://DUMMYURL/getStrategy/${fetchData.symbol}?interval=${fetchData.interval}&range=${fetchData.duration}&strategy=${fetchData.strategy}`
  );
  if (error) {
    return { data: [], error };
  }
  const tradeMarkers: SeriesMarker<Time>[] = data;
  return { data: tradeMarkers, error: null };
  */



  //PLACEHOLDERS:
  const tradeMarkers: SeriesMarker<Time>[] = [
    {
      time: { year: 2025, month: 6, day: 1 },
      position: "belowBar", // OK bez price
      shape: "arrowUp",
      color: "#22AB94",
      text: "Buy 5",
    },
    {
      time: { year: 2025, month: 6, day: 18 },
      position: "aboveBar", // OK bez price
      shape: "arrowDown",
      color: "#F7525F",
      text: "Sell 3",
    },
  ];
  return { data: tradeMarkers, error: null };
}
