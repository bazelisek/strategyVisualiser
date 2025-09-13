"use client";

import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  createChart,
  CrosshairMode,
  ColorType,
  UTCTimestamp,
  CandlestickSeries,
  LineSeries,
  LineStyle,
  SeriesMarker,
  Time,
  createSeriesMarkers,
  ISeriesMarkersPluginApi,
} from "lightweight-charts";
import { calculateMovingAverageSeriesData } from "@/util/indicators/movingAverage";
import { calculateExponentialMovingAverageSeriesData } from "@/util/indicators/exponentialMovingAverage";
import { calculateCCISeriesData } from "@/util/indicators/CCI";
import { RootState } from "@/store/reduxStore";
import { calculateSupertrendSeriesData } from "@/util/indicators/supertrend";

interface CandlestickChartProps {
  width: number;
  height: number;
  candles: {
    time: number;
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
  tradeMarkers
}) => {
  const indicatorSlice = useSelector((state: RootState) => state.indicators);
  const chartRef = useRef<HTMLDivElement>(null);
  const cciRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const topHeight = indicatorSlice.commodityChannelIndex.visible
      ? height * 0.7
      : height;
    const bottomHeight = indicatorSlice.commodityChannelIndex.visible
      ? height * 0.3
      : 0;

    const mainChart = createChart(chartRef.current, {
      width,
      height: topHeight,
      layout: {
        background: { color: "#1e1e2a", type: ColorType.Solid },
        textColor: "#d1d4dc",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "#2b2b43", style: LineStyle.Solid },
        horzLines: { color: "#2b2b43", style: LineStyle.Solid },
      },
      crosshair: { mode: CrosshairMode.MagnetOHLC },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderColor: "#2b2b43", timeVisible: true },
    });

    let cciChart: ReturnType<typeof createChart> | null = null;
    if (indicatorSlice.commodityChannelIndex.visible && cciRef.current) {
      cciChart = createChart(cciRef.current, {
        width,
        height: bottomHeight,
        layout: {
          background: { color: "#1e1e2a", type: ColorType.Solid },
          textColor: "#d1d4dc",
          fontSize: 12,
        },
        grid: {
          vertLines: { color: "#2b2b43", style: LineStyle.Solid },
          horzLines: { color: "#2b2b43", style: LineStyle.Solid },
        },
        crosshair: { mode: CrosshairMode.MagnetOHLC },
        rightPriceScale: { borderVisible: false },
        timeScale: { borderColor: "#2b2b43", timeVisible: true },
      });
    }

    // Sync time axis
    mainChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range && cciChart) cciChart.timeScale().setVisibleLogicalRange(range);
    });
    if (cciChart) {
      cciChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) mainChart.timeScale().setVisibleLogicalRange(range);
      });
    }

    // Candlesticks
    const candleSeries = mainChart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      priceLineVisible: true,
      priceLineColor: "rgba(0,0,0,0.5)",
    });

    const data = candles
      .map((c) => ({
        time: Number(c.time) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
      .filter(({ open, high, low, close }) =>
        [open, high, low, close].every(Number.isFinite)
      )
      .sort((a, b) => a.time - b.time);

    candleSeries.setData(data);
    let seriesMarkersApi: ISeriesMarkersPluginApi<Time> | null = null;
    

    // Add trade markers
    if (tradeMarkers && tradeMarkers.length > 0) {
      seriesMarkersApi = createSeriesMarkers(candleSeries, tradeMarkers);
    }

    // Moving Average
    if (indicatorSlice.movingAverage.visible) {
      const ma = mainChart.addSeries(LineSeries, {
        color: "#2962FF",
        lineWidth: 1,
      });
      ma.setData(
        calculateMovingAverageSeriesData(
          candles,
          indicatorSlice.movingAverage.value.maLength
        )
      );
    }

    // Exponential Moving Average
    if (indicatorSlice.exponentialMovingAverage.visible) {
      const ema = mainChart.addSeries(LineSeries, {
        color: "#29f8ff",
        lineWidth: 1,
      });
      ema.setData(
        calculateExponentialMovingAverageSeriesData(
          candles,
          indicatorSlice.exponentialMovingAverage.value.emaLength
        )
      );
    }

    // CCI
    if (indicatorSlice.commodityChannelIndex.visible && cciChart) {
      const cciSeries = cciChart.addSeries(LineSeries, {
        color: "#f829ffff",
        lineWidth: 1,
      });

      cciSeries.createPriceLine({ price: 100, color: "red", lineWidth: 1 });
      cciSeries.createPriceLine({ price: -100, color: "green", lineWidth: 1 });

      cciSeries.setData(
        calculateCCISeriesData(
          candles,
          indicatorSlice.commodityChannelIndex.value.cciLength
        )
      );
    }
    if (indicatorSlice.supertrend.visible) {
      const supertrendSeries = mainChart.addSeries(LineSeries, {
        color: "#adff29",
        lineWidth: 1,
      });

      supertrendSeries.setData(
        calculateSupertrendSeriesData(
          candles,
          indicatorSlice.supertrend.value.multiplier,
          indicatorSlice.supertrend.value.period,
        )
      );
    }

    return () => {
      seriesMarkersApi?.setMarkers?.([]);
      seriesMarkersApi?.detach?.();
      mainChart.remove();
      cciChart?.remove();
    };
  }, [width, height, candles, indicatorSlice, tradeMarkers]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div ref={chartRef} />
      {indicatorSlice.commodityChannelIndex.visible && <div ref={cciRef} />}
    </div>
  );
};

export default CandlestickChart;
