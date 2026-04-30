"use client";

import { useStrategyName } from "@/hooks/useStrategyName";
import {
  candleData,
  extractSymbolsFromJobResult,
  extractTradeMarkersFromJobResult,
} from "@/util/serverFetch";
import {
  getAggregatedStrategyPerformance,
  getStrategyPerformance,
  StrategyPerformance,
  Trade,
} from "@/util/strategyPerformance/strategyPerformance";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
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
import DropdownButton from "../Input/Buttons/DropdownButton";
import TradeDetails from "./TradeDetails";

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
  strategyData: {
    time: number;
    amount: number;
  }[];
  strategy: string;
  className?: string;
  jobResult: unknown;
  selectedSymbol: string;
  universe: string[];
  loadCandlesForSymbols: (
    symbols: string[],
  ) => Promise<Record<string, TransformedData>>;
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
  avgBuy: number;
  avgSell: number;
  avgPnL: number;
  avgPctFinal: number;
  timeInvested: number;
} | null;

type PerformanceScope = "current" | "global";

function enrichPerformance(
  performance: StrategyPerformance,
): EnrichedStrategyPerformance {
  if (!performance.data) return null;

  const trades: EnrichedTrade[] = performance.data.trades.map((trade) => ({
    ...trade,
    pct: ((trade.sell - trade.buy) / trade.buy) * 100,
  }));
  const closedTrades = trades.filter((trade) => !trade.isOpen);
  const openTrades = trades.filter((trade) => trade.isOpen);
  const wins = closedTrades.filter((trade) => trade.pct > 0).length;
  const losses = closedTrades.filter((trade) => trade.pct <= 0).length;
  const totalPct = closedTrades.reduce((sum, trade) => sum + trade.pct, 0);
  const avgPct = closedTrades.length ? totalPct / closedTrades.length : 0;
  const pnl = closedTrades.reduce((sum, trade) => sum + (trade.sell - trade.buy), 0);
  const totalBuyValue = closedTrades.reduce((sum, trade) => sum + trade.buy, 0);
  const totalSellValue = closedTrades.reduce((sum, trade) => sum + trade.sell, 0);
  const avgBuy = closedTrades.length ? totalBuyValue / closedTrades.length : 0;
  const avgSell = closedTrades.length ? totalSellValue / closedTrades.length : 0;
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
    totalPct,
    avgBuy,
    avgSell,
    avgPnL,
    avgPctFinal: closedTrades.length ? totalPct / closedTrades.length : 0,
    timeInvested: performance.data.timeInvested,
  };
}

const StrategyPerformanceOverview: React.FC<
  StrategyPerformanceOverviewProps
> = ({
  transformedData,
  strategy,
  strategyData,
  className,
  jobResult,
  selectedSymbol,
  universe,
  loadCandlesForSymbols,
}) => {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<PerformanceScope>("current");
  const [globalCandles, setGlobalCandles] = useState<Record<string, TransformedData>>(
    {},
  );
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const strategyName = useStrategyName(strategy);

  const currentPerformance = useMemo(() => {
    if (!selectedSymbol) {
      return { error: "Select a stock tab to inspect current-stock performance." };
    }
    if (transformedData.candles.length === 0) {
      return { error: "No candlestick data found." };
    }
    return getStrategyPerformance(strategyData, transformedData);
  }, [selectedSymbol, strategyData, transformedData]);

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
    if (!open || scope !== "global" || globalSymbols.length === 0) {
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
  }, [globalSymbols, loadCandlesForSymbols, open, scope]);

  const globalPerformance = useMemo(() => {
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
        return {
          strategyData: extractTradeMarkersFromJobResult(jobResult, item),
          transformedData: symbolData,
        };
      })
      .filter(
        (
          item,
        ): item is {
          strategyData: { time: number; amount: number }[];
          transformedData: TransformedData;
        } => item !== null,
      );

    if (inputs.length !== globalSymbols.length) {
      return { error: "Loading global performance..." };
    }

    return getAggregatedStrategyPerformance(inputs);
  }, [
    globalCandles,
    globalError,
    globalLoading,
    globalSymbols,
    jobResult,
  ]);

  const performance = scope === "global" ? globalPerformance : currentPerformance;
  const enriched = useMemo(() => enrichPerformance(performance), [performance]);

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
            <Sheet sx={{ mt: 2, p: 2, borderRadius: "lg" }}>
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
                  : "Current stock performance reflects the stock shown in the chart tabs."}
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
                      <Typography level="body-sm">Win Rate</Typography>
                      <Typography fontSize="xl" fontWeight="lg">
                        {enriched.winRate.toFixed(1)}%
                      </Typography>
                    </Card>

                    <Card>
                      <Typography level="body-sm">Avg Trade</Typography>
                      <Typography fontSize="xl" fontWeight="lg">
                        {enriched.avgPct.toFixed(2)}%
                      </Typography>
                    </Card>

                    <Card>
                      <Typography level="body-sm">Total PnL</Typography>
                      <Typography
                        fontSize="xl"
                        fontWeight="lg"
                        color={enriched.pnl >= 0 ? "success" : "danger"}
                      >
                        {enriched.pnl.toFixed(2)}
                      </Typography>
                    </Card>

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
                          <Typography level="body-sm">With strategy:</Typography>
                          <Typography
                            fontSize="xl"
                            fontWeight="lg"
                            color={enriched.totalPct >= 0 ? "success" : "danger"}
                          >
                            {enriched.totalPct.toFixed(2)}%
                          </Typography>
                        </Card>
                        <Card>
                          <Typography level="body-sm">Without strategy:</Typography>
                          <Typography
                            fontSize="xl"
                            fontWeight="lg"
                            color={
                              performance.data.earningsWithoutStrategyPct >= 0
                                ? "success"
                                : "danger"
                            }
                          >
                            {performance.data.earningsWithoutStrategyPct.toFixed(2)}%
                          </Typography>
                        </Card>
                        <Card>
                          <Typography level="body-sm">Time invested:</Typography>
                          <Typography fontSize="xl" fontWeight="lg">
                            {(enriched.timeInvested * 100).toFixed(2)}%
                          </Typography>
                        </Card>
                      </Stack>
                    </>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <TradeDetails enriched={enriched} performance={performance} />

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
                      {enriched.pnl > 0
                        ? "Strategy is net profitable. Positive expectancy confirmed."
                        : "Strategy is net losing. Edge is not statistically supported."}
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
