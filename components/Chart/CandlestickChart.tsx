"use client";

import { calculateMovingAverageSeriesData } from "@/util/util";
import {
  createChart,
  CandlestickSeries,
  CrosshairMode,
  createSeriesMarkers,
  SeriesMarker,
  Time,
  ColorType,
  UTCTimestamp,
  CandlestickData,
  LineSeries,
} from "lightweight-charts";
import React, { ReactNode, useEffect } from "react";
import { useSelector } from "react-redux";

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
  tradeMarkers: SeriesMarker<Time>[];
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  width,
  height,
  candles,
  tradeMarkers,
}) => {
  const indicatorSlice = useSelector((state: any) => state.indicators);
  const chartRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      width,
      height,
      layout: {
        background: { color: "#1e1e2a", type: ColorType.Solid },
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
        secondsVisible: true,
      },
    });

    if (indicatorSlice.movingAverage.visible) {
      const maSeries = chart.addSeries(LineSeries, {color: '#2962FF', lineWidth: 1 });
      const maData = calculateMovingAverageSeriesData(candles, indicatorSlice.movingAverage.value.maLength);
      maSeries.setData(maData);
    }
    
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      priceLineVisible: true,
      priceLineColor: "rgba(0,0,0,0.5)",
    });

    //console.log(candles);
    const data: CandlestickData<UTCTimestamp>[] = candles
      .map((c) => ({
        time: Number(c.time) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
      .filter(
        (c) =>
          c.open !== null &&
          c.high !== null &&
          c.low !== null &&
          c.close !== null
      )
      .sort((a, b) => a.time - b.time);

    series.setData(data);

    // Přidej markery
    createSeriesMarkers(series, tradeMarkers);

    return () => {
      chart.remove();
    };
  }, [width, height, candles, tradeMarkers, indicatorSlice]);

  return <div ref={chartRef} />;
};

export default CandlestickChart;
