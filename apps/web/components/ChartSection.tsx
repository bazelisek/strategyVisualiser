"use client";
import { useChartData } from "@/hooks/useChartData";
import { getTradeMarkers } from "@/util/markers";
import { useSearchParams } from "next/navigation";
import React, { ReactNode } from "react";
import CandlestickChartWrapper from "./Chart/CandlestickChartWrapper";
import classes from "./ChartSection.module.css";
import StrategyPerformanceOverview from "./StrategyPerformanceOverview";
import { readTilesFromSearchParams } from "@/util/tilesSearchParams";

interface ChartSectionProps {
  children?: ReactNode;
  index: number;
}

const ChartSection: React.FC<ChartSectionProps> = ({ index }) => {
  const params = useSearchParams();
  const tiles = readTilesFromSearchParams(params);
  const tile = tiles[index];
  const symbol = tile?.symbol;
  const interval = tile?.interval;
  const period1 = tile?.period1;
  const period2 = tile?.period2;
  const strategy = tile?.strategy;

  if (!symbol || !interval || !strategy || !Number(period1) || !Number(period2)) {
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
