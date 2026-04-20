'use client';

import { candleData } from "@/util/serverFetch";
import {
  getStrategyPerformance,
  Trade,
} from "@/util/strategyPerformance/strategyPerformance";
import React, { ReactNode, useMemo, useState } from "react";
import AnimationButton from "./Input/Buttons/AnimationButton";
import { AnimatePresence, motion } from "framer-motion";
import classes from "./StrategyPerformanceOverview.module.css";
import Table from "./common/Table";
import { Typography, Sheet, Stack, Chip, Divider, Card } from "@mui/joy";
import { formatLocalDateTime } from "@/util/time";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import InsightsIcon from "@mui/icons-material/Insights";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { TableCell, TableRow } from "@mui/material";
import DropdownButton from "./Input/Buttons/DropdownButton";
import { useStrategyName } from "@/hooks/useStrategyName";

type EnrichedTrade = Trade & {
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

const StrategyPerformanceOverview: React.FC<
  StrategyPerformanceOverviewProps
> = ({ transformedData, strategy, strategyData, className }) => {
  const [open, setOpen] = useState(false);

  const strategyName = useStrategyName(strategy);
  const performance = getStrategyPerformance(strategyData, transformedData);

  const enriched = useMemo(() => {
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
          {strategyName ?? `Strategy ${strategy}`}
        </DropdownButton>
      </Sheet>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ overflow: "hidden" }}
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

                  <Divider sx={{ my: 2 }} />

                  {/* BEST / WORST */}
                  <Stack direction="row" spacing={2}>
                    <Chip color="success" startDecorator={<TrendingUpIcon />}>
                      Best: {performance.data!.bestTrade.result.toFixed(2)}
                    </Chip>

                    <Chip color="danger" startDecorator={<TrendingDownIcon />}>
                      Worst: {performance.data!.worstTrade.result.toFixed(2)}
                    </Chip>
                  </Stack>

                  {/* TABLE */}
                  <Typography level="title-md" sx={{ mt: 2 }}>
                    Trades
                  </Typography>

                  <Table
                    columns={[
                      {
                        id: "buyTime",
                        header: "Buy",
                        cell: (r: EnrichedTrade) => formatLocalDateTime(r.buyTime),
                        sortable: true,
                      },
                      {
                        id: "sellTime",
                        header: "Sell",
                        cell: (r: EnrichedTrade) => formatLocalDateTime(r.sellTime),
                        sortable: true,
                      },
                      {
                        id: "buy",
                        header: "Buy",
                        cell: (r: EnrichedTrade) => r.buy.toFixed(2),
                        sortable: true,
                      },
                      {
                        id: "sell",
                        header: "Sell",
                        cell: (r: EnrichedTrade) => r.sell.toFixed(2),
                        sortable: true,
                      },
                      {
                        id: "result",
                        header: "PnL",
                        cell: (r: EnrichedTrade) => r.result.toFixed(2),
                        sortable: true,
                      },
                      {
                        id: "pct",
                        header: "%",
                        cell: (r: EnrichedTrade) => (
                          <Typography color={r.pct >= 0 ? "success" : "danger"}>
                            {r.pct.toFixed(2)}%
                          </Typography>
                        ),
                        sortable: true,
                      },
                    ]}
                    rows={enriched.trades}
                    renderFooter={() => (
                      <>
                        <TableRow>
                          <TableCell colSpan={2}>
                            <Typography>
                              <strong>Total</strong>
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {enriched.totalBuyValue.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {enriched.totalSellValue.toFixed(2)}
                          </TableCell>
                          <TableCell>{enriched.pnl.toFixed(2)}</TableCell>
                          <TableCell>
                            <Typography
                              color={
                                enriched.totalPct >= 0 ? "success" : "danger"
                              }
                            >
                              {enriched.totalPct.toFixed(2)}%
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={2}>
                            <Typography>
                              <strong>Average</strong>
                            </Typography>
                          </TableCell>
                          <TableCell>{enriched.avgBuy.toFixed(2)}</TableCell>
                          <TableCell>{enriched.avgSell.toFixed(2)}</TableCell>
                          <TableCell>{enriched.avgPnL.toFixed(2)}</TableCell>
                          <TableCell>
                            <Typography
                              color={
                                enriched.avgPctFinal >= 0 ? "success" : "danger"
                              }
                            >
                              {enriched.avgPctFinal.toFixed(2)}%
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  />

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

                    <Typography level="body-sm">
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
