"use client";

import {
  createChart,
  CandlestickSeries,
  CrosshairMode,
  createSeriesMarkers,
  SeriesMarker,
  Time,
  ColorType,
} from "lightweight-charts";
import React, { ReactNode, useEffect } from "react";

interface CandlestickChartProps {
  children?: ReactNode;
  width: number;
  height: number;
  candles: { time: string; open: number; high: number; low: number; close: number }[];
  tradeMarkers: SeriesMarker<Time>[];
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  width,
  height,
  candles,
  tradeMarkers,
}) => {
  const chartRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      width,
      height,
      layout: {
        background: { color: "#1e1e2a", type: ColorType.Solid},
        textColor: "#d1d4dc",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "#2b2b43", style: 1 },
        horzLines: { color: "#2b2b43", style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.MagnetOHLC,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderColor: "#2b2b43",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      priceLineVisible: true,
      priceLineColor: "rgba(0,0,0,0.5)",
    });
    

    series.setData(candles);

    // Přidej markery
    createSeriesMarkers(series, tradeMarkers);

    return () => {
      chart.remove();
    };
  }, [width, height, candles, tradeMarkers]);

  return <div ref={chartRef} />;
};

export default CandlestickChart;
