"use client";
import { useChartData } from "@/hooks/useChart";
import { getTradeMarkers } from "@/util/util";
import { SeriesMarker, Time } from "lightweight-charts";
import { useSearchParams } from "next/navigation";
import React, { ReactNode, useState } from "react";

interface ChartWrapperProps {
  children?: ReactNode;
}

const ChartWrapper: React.FC<ChartWrapperProps> = (props) => {
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol") || "";
  const interval = searchParams.get("interval") || "";
  const duration = searchParams.get("duration") || "";
  const strategy = searchParams.get("strategy") || "";
  const { strategyData, loading, transformedData, error } = useChartData(
    { symbol, interval, duration, strategy },
    "/"
  );
  const tradeMarkers = getTradeMarkers(strategyData);
  return <div>ChartWrapper</div>;
};

export default ChartWrapper;
