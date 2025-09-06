import axios from "axios";
import { UTCTimestamp } from "lightweight-charts";

export function transformYahooToCandles(raw: any): {
  symbol: string;
  longName: string;
  candles: {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
} {
  const result = raw.chart.result[0];
  const ts = result.timestamp;
  const quote = result.indicators.quote[0];
  const longName = result.meta.longName;
  const symbol = result.meta.symbol;
  return {symbol, longName, candles: ts.map((t: number, i: number) => {
    return {
      time: t as UTCTimestamp,
      open: quote.open[i],
      high: quote.high[i],
      low: quote.low[i],
      close: quote.close[i],
    };
  })};
}

export async function fetchDataFromUrl(url: string) {
  console.log(`Fetching from ${url}`);
  // stock code: for example AAPL
  // interval: for eample 1d
  // range: for example 1mo
  try {
    const result = await axios.get(url);
    const data = result.data;
    //console.log(JSON.stringify(data));
    return { data, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: `failed to fetch from ${url}` };
  }
}
