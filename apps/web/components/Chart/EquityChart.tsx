"use client";

import React, { useEffect, useRef } from "react";
import {
  createChart,
  UTCTimestamp,
  IChartApi,
  LineSeries,
} from "lightweight-charts";
import { getBaseChartOptions } from "@/util/charts";
import { EquityPoint } from "@/util/strategyPerformance/strategyPerformance";

interface EquityChartProps {
  width: number;
  height: number;
  data: EquityPoint[];
}

const EquityChart: React.FC<EquityChartProps> = ({ width, height, data }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(
      chartRef.current,
      getBaseChartOptions(width, height),
    );

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#2962FF",
      lineWidth: 2,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    const chartData = data
      .map((p) => ({
        time: Number(p.time) as UTCTimestamp,
        value: p.value,
      }))
      .sort((a, b) => a.time - b.time);

    lineSeries.setData(chartData);

    // Fit content
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [width, height, data]);

  return <div ref={chartRef} />;
};

export default EquityChart;
