"use client";

import { createChart, CandlestickSeries } from "lightweight-charts";
import React, { ReactNode, useEffect } from "react";

interface CandlestickChartProps {
  children?: ReactNode;
  width: number;
  height: number;
  candles: {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ width, height, candles }) => {
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
        vertLines: { color: gridVertLinesColor },
        horzLines: { color: gridHorzLinesColor },
      },
    });
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    candlestickSeries.setData(candles);
    return () => {
      chart.remove();
    };
  }, []);

  return <div ref={chartRef}></div>;
};

export default CandlestickChart;
