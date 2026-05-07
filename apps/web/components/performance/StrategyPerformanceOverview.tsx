"use client";

import { useStrategyName } from "@/hooks/useStrategyName";
import {
  candleData,
  extractSymbolsFromJobResult,
  extractTradePointsFromJobResult,
} from "@/util/serverFetch";
import {
  getAggregatedStrategyPerformance,
  SymbolContribution,
  StrategyPerformance,
  Trade,
  EquityPoint,
} from "@/util/strategyPerformance/strategyPerformance";
import React, { ReactNode, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import classes from "./StrategyPerformanceOverview.module.css";
import {
  Typography,
  Sheet,
  Stack,
  Chip,
  Divider,
  Card,
  Button,
} from "@mui/joy";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import InsightsIcon from "@mui/icons-material/Insights";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TimelineIcon from "@mui/icons-material/Timeline";
import DropdownButton from "../Input/Buttons/DropdownButton";
import TradeDetails from "./TradeDetails";
import CustomAccordion from "../common/CustomAccordion";
import EquityChart from "../Chart/EquityChart";

export type EnrichedTrade = Trade & {
  pct: number;
};

type TransformedData = {
  longName: string;
  symbol: string;
  candles: candleData;
};

interface StrategyPerformanceOverviewProps {
  children?: ReactNode;
  transformedData: TransformedData;
  strategy: string;
  className?: string;
  jobResult: unknown;
  selectedSymbol: string;
  universe: string[];
  loadCandlesForSymbols: (
    symbols: string[],
  ) => Promise<Record<string, TransformedData>>;
  availableMoney: number;
  lastRunConfig: Record<string, unknown>;
}

export type EnrichedStrategyPerformance = {
  trades: EnrichedTrade[];
  closedTrades: EnrichedTrade[];
  openTrades: EnrichedTrade[];
  wins: number;
  losses: number;
  winRate: number;
  avgPct: number;
  pnl: number;
  totalBuyValue: number;
  totalSellValue: number;
  totalPct: number;
  avgBuyValue: number;
  avgSellValue: number;
  avgPnL: number;
  avgPctFinal: number;
  timeInvested: number;
  totalReturnPct: number;
  benchmarkPct: number;
  contributionPct?: number;
  realizedPnl?: number;
  unrealizedPnl?: number;
  equityCurve?: EquityPoint[];
} | null;

type PerformanceScope = "current" | "global";

function enrichPerformance(
  performance: StrategyPerformance,
  contribution?: SymbolContribution,
): EnrichedStrategyPerformance {
  if (!performance.data) return null;

  const sourceTrades = contribution?.trades ?? performance.data.trades;
  const trades: EnrichedTrade[] = sourceTrades.map((trade) => ({
    ...trade,
    pct: trade.buyValue > 0 ? (trade.result / trade.buyValue) * 100 : 0,
  }));
  const closedTrades = trades.filter((trade) => !trade.isOpen);
  const openTrades = trades.filter((trade) => trade.isOpen);
  const wins = closedTrades.filter((trade) => trade.pct > 0).length;
  const losses = closedTrades.filter((trade) => trade.pct <= 0).length;
  const totalPct = closedTrades.reduce((sum, trade) => sum + trade.pct, 0);
  const avgPct = closedTrades.length ? totalPct / closedTrades.length : 0;
  const pnl =
    contribution?.pnl ??
    performance.data.pnl;
  const totalBuyValue =
    contribution?.totalBuyValue ??
    trades.reduce((sum, trade) => sum + trade.buyValue, 0);
  const totalSellValue =
    contribution?.totalSellValue ??
    trades.reduce((sum, trade) => sum + trade.sellValue, 0);
  const avgBuyValue = closedTrades.length
    ? closedTrades.reduce((sum, trade) => sum + trade.buyValue, 0) /
      closedTrades.length
    : 0;
  const avgSellValue = closedTrades.length
    ? closedTrades.reduce((sum, trade) => sum + trade.buyValue, 0) /
      closedTrades.length
    : 0;
  const avgPnL = closedTrades.length ? pnl / closedTrades.length : 0;

  return {
    trades,
    closedTrades,
    openTrades,
    wins,
    losses,
    winRate: closedTrades.length ? (wins / closedTrades.length) * 100 : 0,
    avgPct,
    pnl,
    totalBuyValue,
    totalSellValue,
    totalPct: contribution?.returnPct ?? performance.data.totalReturnPct,
    avgBuyValue,
    avgSellValue,
    avgPnL,
    avgPctFinal: closedTrades.length ? totalPct / closedTrades.length : 0,
    timeInvested: contribution?.averageInvestedPct ?? performance.data.timeInvested,
    totalReturnPct: contribution?.returnPct ?? performance.data.totalReturnPct,
    benchmarkPct: contribution?.benchmarkPct ?? performance.data.earningsWithoutStrategyPct,
    contributionPct: contribution?.contributionPct,
    realizedPnl: contribution?.realizedPnl,
    unrealizedPnl: contribution?.unrealizedPnl,
    equityCurve: performance.data.equityCurve,
  };
}

const StrategyPerformanceOverview: React.FC<
  StrategyPerformanceOverviewProps
> = ({
  transformedData,
  strategy,
  className,
  jobResult,
  selectedSymbol,
  universe,
  loadCandlesForSymbols,
  availableMoney,
  lastRunConfig,
}) => {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<PerformanceScope>("global");
  const [globalCandles, setGlobalCandles] = useState<Record<string, TransformedData>>(
    {},
  );
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(1060);

  useLayoutEffect(() => {
    if (!containerEl) return;

    const updateWidth = () => {
      const w = Math.floor(containerEl.getBoundingClientRect().width);
      if (w && w !== chartWidth) setChartWidth(w);
    };
    updateWidth();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          const w = Math.floor(entry.contentRect.width);
          setChartWidth(w);
        }
      }
    });

    observer.observe(containerEl);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerEl]);

  const strategyName = useStrategyName(strategy);
  const allTradePoints = useMemo(
    () => extractTradePointsFromJobResult(jobResult),
    [jobResult],
  );

  const globalSymbols = useMemo(() => {
    const unique = new Set<string>();
    universe.forEach((item) => {
      if (item.trim()) unique.add(item);
    });
    extractSymbolsFromJobResult(jobResult).forEach((item) => unique.add(item));
    return Array.from(unique);
  }, [jobResult, universe]);

  useEffect(() => {
    setGlobalCandles((prev) => {
      if (!selectedSymbol || transformedData.candles.length === 0) {
        return prev;
      }
      const current = prev[selectedSymbol];
      if (
        current &&
        current.symbol === transformedData.symbol &&
        current.candles === transformedData.candles
      ) {
        return prev;
      }
      return {
        ...prev,
        [selectedSymbol]: transformedData,
      };
    });
  }, [selectedSymbol, transformedData]);

  useEffect(() => {
    if (!open || globalSymbols.length === 0) {
      return;
    }

    let isActive = true;
    setGlobalLoading(true);
    setGlobalError("");

    void loadCandlesForSymbols(globalSymbols)
      .then((loaded) => {
        if (!isActive) return;
        setGlobalCandles((prev) => ({ ...prev, ...loaded }));
      })
      .catch((error) => {
        if (!isActive) return;
        setGlobalError(
          error instanceof Error
            ? error.message
            : "Failed to load global performance data.",
        );
      })
      .finally(() => {
        if (isActive) {
          setGlobalLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [globalSymbols, loadCandlesForSymbols, open]);

  const portfolioPerformance = useMemo(() => {
    if (globalSymbols.length === 0) {
      return { error: "Add at least one stock to the universe to compare global performance." };
    }
    if (globalLoading) {
      return { error: "Loading global performance..." };
    }
    if (globalError) {
      return { error: globalError };
    }

    const inputs = globalSymbols
      .map((item) => {
        const symbolData = globalCandles[item];
        if (!symbolData) return null;
        const normalizedItem = item.toUpperCase();
        return {
          strategyData: allTradePoints
            .filter((trade) => {
              const tradeSymbol = trade.symbol?.trim().toUpperCase();
              if (!tradeSymbol) {
                return globalSymbols.length === 1;
              }
              return tradeSymbol === normalizedItem;
            })
            .map((trade) => ({
              ...trade,
              symbol: item,
            })),
          transformedData: symbolData,
          symbol: item,
        };
      })
      .filter(
        (
          item,
        ): item is typeof item & {
          strategyData: { symbol?: string; time: number; amount: number }[];
          transformedData: TransformedData;
          symbol: string;
        } => item !== null,
      );

    if (inputs.length !== globalSymbols.length) {
      return { error: "Loading global performance..." };
    }

    const feeRateValue = lastRunConfig?.["feeRate"] ?? lastRunConfig?.["fees"];
    const feeRate = typeof feeRateValue === "number" ? feeRateValue : 0.0000;

    return getAggregatedStrategyPerformance(inputs, availableMoney, feeRate);
  }, [
    availableMoney,
    allTradePoints,
    globalCandles,
    globalError,
    globalLoading,
    globalSymbols,
    lastRunConfig,
  ]);

  const currentContribution = useMemo(() => {
    if (!selectedSymbol) {
      return null;
    }
    return portfolioPerformance.data?.symbolBreakdown[selectedSymbol] ?? null;
  }, [portfolioPerformance.data, selectedSymbol]);

  const currentPerformance = useMemo(() => {
    if (!selectedSymbol) {
      return { error: "Select a stock tab to inspect current-stock contribution." };
    }
    return portfolioPerformance;
  }, [portfolioPerformance, selectedSymbol]);

  const performance = scope === "global" ? portfolioPerformance : currentPerformance;
  const enriched = useMemo(
    () => enrichPerformance(performance, scope === "current" ? currentContribution ?? undefined : undefined),
    [currentContribution, performance, scope],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -120 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring" }}
      className={`${className} ${classes.div}`}
    >
      <Sheet
        variant="outlined"
        sx={{
          borderRadius: "lg",
          p: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <AnalyticsIcon color="primary" />
          <Typography fontWeight="lg">Strategy Performance</Typography>
        </Stack>

        <DropdownButton onClick={() => setOpen((prev) => !prev)}>
          {strategyName || `Strategy ${strategy}`}
        </DropdownButton>
      </Sheet>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ overflow: "hidden", width: "100%" }}
          >
            <Sheet
              ref={(el) => setContainerEl(el)}
              sx={{ mt: 2, p: 2, borderRadius: "lg" }}
            >
              <Stack direction="row" spacing={1}>
                <Button
                  variant={scope === "current" ? "solid" : "soft"}
                  onClick={() => setScope("current")}
                >
                  Current Stock
                </Button>
                <Button
                  variant={scope === "global" ? "solid" : "soft"}
                  onClick={() => setScope("global")}
                >
                  Global
                </Button>
              </Stack>

              <Typography level="body-sm" sx={{ mt: 1 }}>
                {scope === "global"
                  ? "Global performance aggregates every stock in the resolved universe."
                  : "Current stock performance shows how the selected stock contributed to the portfolio result."}
              </Typography>

              {performance.error && (
                <Typography color="danger" sx={{ mt: 2 }}>
                  {performance.error}
                </Typography>
              )}

              {!performance.error && enriched && (
                <>
                  <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 2 }}>
                    <Card>
                      <Typography level="body-sm">
                        {scope === "global" ? "Portfolio Return" : "Return Contribution"}
                      </Typography>
                      <Typography fontSize="xl" fontWeight="lg">
                        {enriched.totalReturnPct.toFixed(2)}%
                      </Typography>
                    </Card>

                    <Card>
                      <Typography level="body-sm">Avg Trade</Typography>
                      <Typography fontSize="xl" fontWeight="lg">
                        {enriched.avgPct.toFixed(2)}%
                      </Typography>
                    </Card>

                    <Card>
                      <Typography level="body-sm">
                        {scope === "global" ? "Total PnL" : "Contribution"}
                      </Typography>
                      <Typography
                        fontSize="xl"
                        fontWeight="lg"
                        color={enriched.pnl >= 0 ? "success" : "danger"}
                      >
                        {enriched.pnl.toFixed(2)}
                      </Typography>
                    </Card>

                    {scope === "current" && (
                      <Card>
                        <Typography level="body-sm">Share of PnL</Typography>
                        <Typography
                          fontSize="xl"
                          fontWeight="lg"
                          color={(enriched.contributionPct ?? 0) >= 0 ? "success" : "danger"}
                        >
                          {(enriched.contributionPct ?? 0).toFixed(2)}%
                        </Typography>
                      </Card>
                    )}

                    <Card>
                      <Typography level="body-sm">Trades</Typography>
                      <Typography fontSize="xl" fontWeight="lg">
                        {enriched.closedTrades.length}
                      </Typography>
                    </Card>
                  </Stack>

                  {enriched.openTrades.length > 0 && (
                    <Chip
                      sx={{ mt: 2 }}
                      color="warning"
                      startDecorator={<WarningAmberIcon />}
                    >
                      {enriched.openTrades.length} open{" "}
                      {enriched.openTrades.length === 1 ? "trade" : "trades"}{" "}
                      excluded from summary stats
                    </Chip>
                  )}

                  {performance.data && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Card>
                          <Typography level="body-sm">
                            {scope === "global" ? "With strategy:" : "Realized PnL:"}
                          </Typography>
                          <Typography
                            fontSize="xl"
                            fontWeight="lg"
                            color={
                              (scope === "global"
                                ? enriched.totalReturnPct
                                : enriched.realizedPnl ?? 0) >= 0
                                ? "success"
                                : "danger"
                            }
                          >
                            {scope === "global"
                              ? `${enriched.totalReturnPct.toFixed(2)}%`
                              : (enriched.realizedPnl ?? 0).toFixed(2)}
                          </Typography>
                        </Card>
                        <Card>
                          <Typography level="body-sm">
                            {scope === "global" ? "Without strategy:" : "Unrealized PnL:"}
                          </Typography>
                          <Typography
                            fontSize="xl"
                            fontWeight="lg"
                            color={
                              (scope === "global"
                                ? enriched.benchmarkPct
                                : enriched.unrealizedPnl ?? 0) >= 0
                                ? "success"
                                : "danger"
                            }
                          >
                            {scope === "global"
                              ? `${enriched.benchmarkPct.toFixed(2)}%`
                              : (enriched.unrealizedPnl ?? 0).toFixed(2)}
                          </Typography>
                        </Card>
                        <Card>
                          <Typography level="body-sm">Avg invested:</Typography>
                          <Typography fontSize="xl" fontWeight="lg">
                            {(enriched.timeInvested * 100).toFixed(2)}%
                          </Typography>
                        </Card>
                      </Stack>
                    </>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <TradeDetails enriched={enriched} />

                  {enriched.equityCurve && enriched.equityCurve.length > 0 && (
                    <Stack sx={{ mt: 2 }}>
                      <CustomAccordion
                        summary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <TimelineIcon />
                            <Typography fontWeight="lg">Equity Curve</Typography>
                          </Stack>
                        }
                      >
                        <Stack sx={{ mt: 2 }}>
                          <EquityChart
                            width={chartWidth - 32} // Account for Sheet padding
                            height={400}
                            data={enriched.equityCurve}
                          />
                        </Stack>
                      </CustomAccordion>
                    </Stack>
                  )}

                  <Sheet
                    variant="soft"
                    sx={{
                      mt: 2,
                      p: 2,
                      borderRadius: "lg",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <InsightsIcon />
                      <Typography fontWeight="lg">Strategy Summary</Typography>
                    </Stack>

                    <Divider sx={{ my: 1 }} />

                    <Typography>
                      {scope === "global"
                        ? enriched.pnl > 0
                          ? "Portfolio finished ahead after replaying the strategy's cash deployment."
                          : "Portfolio finished down after replaying the strategy's cash deployment."
                        : enriched.pnl > 0
                          ? "This stock added positive PnL to the portfolio."
                          : enriched.pnl < 0
                            ? "This stock reduced the portfolio result."
                            : "This stock was neutral for the portfolio result."}
                    </Typography>
                  </Sheet>
                </>
              )}
            </Sheet>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StrategyPerformanceOverview;
