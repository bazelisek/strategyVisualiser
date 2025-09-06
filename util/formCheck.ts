export const validRanges: { [key: string]: string[] } = {
  "1d": ["1m", "2m", "5m", "15m", "30m", "60m", "90m"],
  "5d": ["1m", "2m", "5m", "15m", "30m", "60m", "90m"],
  "1mo": ["5m", "15m", "30m", "60m", "90m", "1d", "5d"],
  "3mo": ["60m", "90m", "1d", "5d", "1wk"],
  "6mo": ["1d", "5d", "1wk", "1mo"],
  "1y": ["1d", "5d", "1wk", "1mo", "3mo"],
  "2y": ["1d", "5d", "1wk", "1mo", "3mo"],
  "5y": ["1d", "5d", "1wk", "1mo", "3mo"],
  "10y": ["1d", "5d", "1wk", "1mo", "3mo"],
  "ytd": ["1d", "5d", "1wk", "1mo", "3mo"],
  "max": ["1d", "5d", "1wk", "1mo", "3mo"],
};

export function checkFormValidity(formData: {
  symbol: { value: string; timeout: boolean };
  interval: { value: string; timeout: boolean };
  duration: { value: string; timeout: boolean };
  strategy: { value: string; timeout: boolean };
}): string {
  const { symbol, interval, duration } = formData;

  if (!symbol.value) return "Symbol cannot be empty";

  if (!validRanges[duration.value].includes(interval.value)) {
    return `The interval "${interval.value}" is not allowed for the selected time period "${duration.value}"`;
  }

  return "";
}
