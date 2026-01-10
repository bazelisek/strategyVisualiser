"use client";
import { useChartData } from "@/hooks/useChartData";
import { getTradeMarkers } from "@/util/markers";
import { useSearchParams } from "next/navigation";
import React, { ReactNode } from "react";
import CandlestickChartWrapper from "./Chart/CandlestickChartWrapper";
import classes from "./ChartSection.module.css";
import StrategyPerformanceOverview from "./StrategyPerformanceOverview";

interface ChartSectionProps {
  children?: ReactNode;
  index: number;
}

const ChartSection: React.FC<ChartSectionProps> = ({ index }) => {
  const params = useSearchParams();
  const symbol = params.getAll("symbol")[index];
  const interval = params.getAll("interval")[index];
  const period1 = params.getAll("period1")[index];
  const period2 = params.getAll("period2")[index];
  const strategy = params.getAll("strategy")[index];

  if (!Number(period1) || !Number(period2)) {
    throw new Error("period is not a  number");
  }
  const { strategyData, loading, transformedData, error } = useChartData(
    {
      symbol,
      interval,
      period1: Number(period1),
      period2: Number(period2),
      strategy,
    },
    "/"
  );
  const tradeMarkers = getTradeMarkers(strategyData);
  return (
    <>
      {error && (
        <div>
          <h2>Something went wrong...</h2>
          <p>Please try again later and check your internet connection.</p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </div>
      )}
      {!error && (
        <CandlestickChartWrapper
          index={index + 1}
          loading={loading}
          transformedData={transformedData}
          tradeMarkers={tradeMarkers}
        />
      )}
      {!loading && !error && (
        <StrategyPerformanceOverview
          transformedData={transformedData}
          strategyData={strategyData}
          strategy={strategy}
          className={classes.div}
        />
      )}
    </>
  );
};

export default ChartSection;
