export function parseStrategyId(strategyValue: string): number | null {
  if (!strategyValue) return null;
  const [rawId] = strategyValue.split(":");
  const id = Number(rawId);
  return Number.isInteger(id) ? id : null;
}
