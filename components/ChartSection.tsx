"use client";
import { useChartData } from "@/hooks/useChart";
import { calculateMovingAverageSeriesData, getTradeMarkers } from "@/util/util";
import { useSearchParams } from "next/navigation";
import React, { ReactNode } from "react";
import CandlestickChartFetcher from "./Chart/CandlestickChartWrapper";
import { motion } from "framer-motion";
import classes from "./ChartSection.module.css";
import StrategyPerformanceOverview from "./StrategyPerformanceOverview";

interface ChartSectionProps {
  children?: ReactNode;
}

const ChartSection: React.FC<ChartSectionProps> = (props) => {
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol") || "";
  const interval = searchParams.get("interval") || "";
  const period1 = searchParams.get("period1") || "";
  const period2 = searchParams.get("period2") || "";
  const strategy = searchParams.get("strategy") || "";
  const { strategyData, loading, transformedData, error } = useChartData(
    { symbol, interval, period1, period2, strategy },
    "/"
  );
  const tradeMarkers = getTradeMarkers(strategyData);
  const maData = calculateMovingAverageSeriesData(transformedData.candles, 20);
  return (
    <>
      <CandlestickChartFetcher
        error={error}
        loading={loading}
        transformedData={transformedData}
        tradeMarkers={tradeMarkers}
        maData={maData}
      />
      {!loading && !error && (
        <motion.div
          // callback ref — při mountu React zavolá setContainerEl(el)
          initial={{ opacity: 0, y: -200 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" }}
          className={classes.div}
        >
          <StrategyPerformanceOverview
            transformedData={transformedData}
            strategyData={strategyData}
            strategy={strategy}
          />
        </motion.div>
      )}
    </>
  );
};

export default ChartSection;
