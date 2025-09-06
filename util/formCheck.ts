const validIntervals: { [key: string]: string[] } = {
  "1m": ["5d", '1d'],
  "2m": ["5d", '1d'],
  "5m": ["5d", '1d'],
  "15m": ["5d", '1d'],
  "30m": ["5d", '1d'],
  "60m": ["5d", '1d'],
  "90m": ["5d", '1d'],
  "1h": ["5d", '1d'],
  "1d": ["5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"],
  "5d": ["1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"],
  "1wk": ["1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"],
  "1mo": ["3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"],
  "3mo": ["6mo", "1y", "2y", "5y", "10y", "ytd", "max"],
};

export function checkFormValidity(formData: {
  symbol: { value: string; timeout: boolean };
  interval: { value: string; timeout: boolean };
  duration: { value: string; timeout: boolean };
  strategy: { value: string; timeout: boolean };
}): string {
  const { symbol, interval, duration } = formData;

  if (!symbol.value) return "Symbol cannot be empty";

  if (!validIntervals[interval.value]) return "Interval invalid";

  if (!validIntervals[interval.value].includes(duration.value)) {
    return `The interval "${interval.value}" is not allowed for the selected time period "${duration.value}"`;
  }

  return "";
}
