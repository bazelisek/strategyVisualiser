export const EPSILON = 1e-7;

export function findFirstCandleIndexAtOrAfter(
  opens: { value: number; time: number }[],
  targetTime: number,
  startIndex: number,
): number {
  let index = startIndex;
  while (index < opens.length && opens[index].time < targetTime) {
    index++;
  }
  return index < opens.length ? index : -1;
}

export function normalizeSymbol(symbol?: string): string | undefined {
  if (!symbol) return undefined;
  const trimmed = symbol.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeCashBase(initialCash: number | undefined, fallbackCash: number): number {
  if (typeof initialCash === "number" && Number.isFinite(initialCash) && initialCash > 0) {
    return initialCash;
  }
  // If we have no initial cash but we have trades, we use the total buy value as base.
  // This is better than defaulting to 1 which causes huge percentages.
  if (Number.isFinite(fallbackCash) && fallbackCash > 0) {
    return fallbackCash;
  }
  // If still nothing, default to a sensible starting amount like 10000
  return 10000;
}
