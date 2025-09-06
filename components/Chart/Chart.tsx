"use client";

import { createChart, LineSeries } from "lightweight-charts";
import React, { ReactNode, useEffect } from "react";

interface ChartProps {
  children?: ReactNode;
  width: number;
  height: number;
  data: { time: string; value: number }[];
}

const Chart: React.FC<ChartProps> = ({ width, height, data }) => {
  const chartBackgroundColor = "#1e1e1e";
  const textColor = "#d1d4dc";
  const gridVertLinesColor = "#2b2b43";
  const gridHorzLinesColor = "#2b2b43";

  const chartRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    const chart = createChart(chartRef.current!, {
      width,
      height,
      layout: {
        background: { color: chartBackgroundColor },
        textColor: textColor,
      },
      grid: {
        vertLines: {color: gridVertLinesColor},
        horzLines: {color: gridHorzLinesColor}
      }
    });
    const lineSeries = chart.addSeries(LineSeries);
    lineSeries.setData(data);
    return () => {
      chart.remove();
    }
  }, []);

  return <div ref={chartRef}></div>;
};

export default Chart;
