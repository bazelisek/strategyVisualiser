"use client";

import { candleData } from "@/util/serverFetch";
import {
  getStrategyPerformance,
  Trade,
} from "@/util/strategyPerformance/strategyPerformance";
import React, { ReactNode, useMemo, useState } from "react";
import AnimationButton from "../Input/Buttons/AnimationButton";
import { AnimatePresence, motion } from "framer-motion";
import classes from "./StrategyPerformanceOverview.module.css";
import Table from "../common/Table";
import {
  Typography,
  Sheet,
  Stack,
  Chip,
  Divider,
  Card,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/joy";
import { formatLocalDateTime } from "@/util/time";

import AnalyticsIcon from "@mui/icons-material/Analytics";
import InsightsIcon from "@mui/icons-material/Insights";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { TableCell, TableRow } from "@mui/material";
import DropdownButton from "../Input/Buttons/DropdownButton";
import { useStrategyName } from "@/hooks/useStrategyName";
import TradeDetails from "./TradeDetails";

export type EnrichedTrade = Trade & {
  pct: number;
};

interface StrategyPerformanceOverviewProps {
  children?: ReactNode;
  transformedData: {
    longName: string;
    symbol: string;
    candles: candleData;
  };
  strategyData: {
    time: number;
    amount: number;
  }[];
  strategy: string;
  className?: string;
}

export type EnrichedStrategyPerformance = {
  trades: EnrichedTrade[];
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
} | null;

const StrategyPerformanceOverview: React.FC<
  StrategyPerformanceOverviewProps
> = ({ transformedData, strategy, strategyData, className }) => {
  const [open, setOpen] = useState(false);

  const strategyName = useStrategyName(strategy);
  const performance = getStrategyPerformance(strategyData, transformedData);

  const enriched: EnrichedStrategyPerformance = useMemo(() => {
    if (!performance.data) return null;

    const trades: EnrichedTrade[] = performance.data.trades.map((t) => {
      const pct = ((t.sell - t.buy) / t.buy) * 100;
      return { ...t, pct };
    });

    const wins = trades.filter((t) => t.pct > 0).length;
    const losses = trades.length - wins;

    const totalPct = trades.reduce((a, b) => a + b.pct, 0);
    const avgPct = trades.length ? totalPct / trades.length : 0;

    const pnl = trades.reduce((a, b) => a + (b.sell - b.buy), 0);

    const totalBuyValue = trades.reduce((a, t) => a + t.buy, 0);
    const totalSellValue = trades.reduce((a, t) => a + t.sell, 0);

    const avgBuy = trades.length ? totalBuyValue / trades.length : 0;
    const avgSell = trades.length ? totalSellValue / trades.length : 0;
    const avgPnL = trades.length ? pnl / trades.length : 0;
    const avgPctFinal = trades.length ? totalPct / trades.length : 0;

    return {
      trades,
      wins,
      losses,
      winRate: trades.length ? (wins / trades.length) * 100 : 0,
      avgPct,
      pnl,
      totalBuyValue,
      totalSellValue,
      totalPct,
      avgBuy,
      avgSell,
      avgPnL,
      avgPctFinal,
    };
  }, [performance.data]);

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

        <DropdownButton onClick={() => setOpen((p) => !p)}>
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
              {performance.error && (
                <Typography color="danger">{performance.error}</Typography>
              )}

              {!performance.error && enriched && (
                <>
                  {/* SUMMARY CARDS */}
                  <Stack direction="row" spacing={2} flexWrap="wrap">
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
                        {enriched.trades.length}
                      </Typography>
                    </Card>
                  </Stack>
                  {performance.data && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Card>
                          <Typography level="body-sm">With strategy:</Typography>
                          <Typography
                            fontSize="xl"
                            fontWeight="lg"
                            color={
                              enriched.totalPct >= 0 ? "success" : "danger"
                            }
                          >
                            {enriched.totalPct.toFixed(2)}%
                          </Typography>
                        </Card>
                        <Card>
                          <Typography level="body-sm">
                            Without strategy:
                          </Typography>
                          <Typography
                            fontSize="xl"
                            fontWeight="lg"
                            color={
                              performance.data?.earningsWithoutStrategyPct >= 0
                                ? "success"
                                : "danger"
                            }
                          >
                            {performance.data?.earningsWithoutStrategyPct.toFixed(
                              2,
                            )}
                            %
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

                    {/* ANALYSIS */}
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
