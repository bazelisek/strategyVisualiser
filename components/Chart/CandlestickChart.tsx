"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  createChart,
  CrosshairMode,
  ColorType,
  UTCTimestamp,
  IChartApi,
  CandlestickSeries,
  LineStyle,
  SeriesMarker,
  Time,
  createSeriesMarkers,
  ISeriesMarkersPluginApi,
} from "lightweight-charts";
import { createMAGraph } from "@/util/indicators/movingAverage";
import { createEMAGraph } from "@/util/indicators/exponentialMovingAverage";
import { createCCIGraph } from "@/util/indicators/CCI";
import { RootState } from "@/store/reduxStore";
import { createSTGraph } from "@/util/indicators/supertrend";
import { candleData } from "@/util/serverFetch";
import { createOBVGraph } from "@/util/indicators/onBalanceVolume";
import { createSecondaryChart } from "@/util/charts";
import { centerToMarker, toUTCTimestamp } from "@/util/markers";
import MarkerNavigation from "./MarkerNavigation";

interface CandlestickChartProps {
  width: number;
  height: number;
  candles: candleData;
  tradeMarkers: SeriesMarker<Time>[];
  index: number;
  chartContainer: HTMLDivElement | null;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  width,
  height,
  candles,
  index,
  tradeMarkers,
  chartContainer,
}) => {
  const indicatorSlice = useSelector((state: RootState) => state.indicators);
  const indicatorsWithIndex = useMemo(
    () => indicatorSlice.filter((item) => item.index === index),
    [indicatorSlice, index]
  );

  const chartRef = useRef<HTMLDivElement>(null);
  const mainChartRef = useRef<IChartApi | null>(null);
  const indicatorRefs = useRef<{ [chartIndex: number]: HTMLDivElement | null }>(
    {}
  );

  const [selectedTime, setSelectedTime] = useState<{
    time: Time;
    index: number;
  } | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Group indicators by chartIndex
    const groupedIndicators = indicatorsWithIndex.reduce(
      (acc, indicator) => {
        const chartIndex = indicator.chartIndex ?? 0;
        if (!acc[chartIndex]) acc[chartIndex] = [];
        acc[chartIndex].push(indicator);
        return acc;
      },
      {} as Record<number, typeof indicatorsWithIndex>
    );

    // Create main chart
    const mainChart = createChart(chartRef.current, {
      width,
      height: height * 0.7,
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

    mainChartRef.current = mainChart;

    // ✅ Allow null to avoid type error
    const charts: Record<number, IChartApi | null> = { 0: mainChart };

    // Create secondary charts
    Object.keys(groupedIndicators).forEach((key) => {
      const chartIndex = Number(key);
      if (chartIndex === 0) return;

      const ref = indicatorRefs.current[chartIndex];
      if (ref) {
        charts[chartIndex] = createSecondaryChart(
          { current: ref },
          mainChart,
          width,
          height * 0.3
        );
      }
    });

    // Main candle series
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

    // Add trade markers
    let seriesMarkersApi: ISeriesMarkersPluginApi<Time> | null = null;
    if (tradeMarkers && tradeMarkers.length > 0) {
      seriesMarkersApi = createSeriesMarkers(candleSeries, tradeMarkers);
    }

    // Click marker handler
    mainChart.subscribeClick((param) => {
      if (!param.time) {
        setSelectedTime(null);
        return;
      }
      const clickedTime = toUTCTimestamp(param.time);
      if (clickedTime === null) {
        setSelectedTime(null);
        return;
      }
      const found = tradeMarkers.findIndex(
        (m) => toUTCTimestamp(m.time) === clickedTime
      );
      if (found !== -1) {
        setSelectedTime({ time: tradeMarkers[found].time, index: found });
        centerToMarker(tradeMarkers[found].time, mainChart);
      } else {
        setSelectedTime(null);
      }
    });

    // Track charts that already have CCI lines
    const chartsWithCCILines = new Set<number>();

    // Render indicators on their respective charts
    Object.entries(groupedIndicators).forEach(([chartIndexStr, indicators]) => {
      const chartIndex = Number(chartIndexStr);
      const chart = charts[chartIndex];
      if (!chart) return;

      indicators.forEach((indicator) => {
        const value = indicator.indicator.value;
        const visible = indicator.indicator.visible;

        if (!visible) return;

        switch (indicator.key) {
          case "movingAverage":
            if ("maLength" in value) createMAGraph(chart, value, candles);
            break;

          case "exponentialMovingAverage":
            if ("emaLength" in value) createEMAGraph(chart, value, candles);
            break;

          case "commodityChannelIndex":
            if ("cciLength" in value) {
              // Only pass addLines=true for the first CCI on this chart
              const addLines = !chartsWithCCILines.has(chartIndex);
              createCCIGraph(chart, value, candles, addLines);
              chartsWithCCILines.add(chartIndex);
            }
            break;

          case "supertrend":
            if (
              value &&
              typeof value === "object" &&
              "multiplier" in value &&
              "period" in value &&
              "color" in value
            ) {
              createSTGraph(mainChart, value, candles);
            }
            break;

          case "onBalanceVolume":
            if ("color" in value) createOBVGraph(chart, value, candles);
            break;
        }
      });
    });

    // Cleanup
    return () => {
      seriesMarkersApi?.setMarkers?.([]);
      seriesMarkersApi?.detach?.();
      Object.values(charts).forEach((chart) => chart?.remove());
      mainChartRef.current = null;
    };
  }, [width, height, candles, indicatorSlice, tradeMarkers, index, indicatorsWithIndex]);

  // Group again for rendering secondary divs
  const groupedIndicators = indicatorsWithIndex.reduce(
    (acc, indicator) => {
      const chartIndex = indicator.chartIndex ?? 0;
      if (!acc[chartIndex]) acc[chartIndex] = [];
      acc[chartIndex].push(indicator);
      return acc;
    },
    {} as Record<number, typeof indicatorsWithIndex>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Main chart */}
      <div ref={chartRef} />

      {/* Secondary charts */}
      {Object.keys(groupedIndicators)
        .filter((key) => Number(key) !== 0)
        .map((key) => {
          const chartIndex = Number(key);
          return (
            <div
              key={`secondary-${chartIndex}`}
              ref={(el) => {
                indicatorRefs.current[chartIndex] = el;
              }}
              style={{ marginTop: "8px" }}
            />
          );
        })}

      {/* Marker info */}
      <div style={{ marginTop: "8px", color: "#fff" }}>
        {selectedTime !== null ? (
          <>Selected marker time: {selectedTime.time.toString()}</>
        ) : (
          <>Click a marker to select it</>
        )}
      </div>

      {/* Marker navigation */}
      {mainChartRef.current && (
        <MarkerNavigation
          chart={mainChartRef.current}
          chartContainer={chartContainer}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          tradeMarkers={tradeMarkers}
        />
      )}
    </div>
  );
};

export default CandlestickChart;
