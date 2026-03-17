"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { candleData } from "@/util/serverFetch";
import { createSecondaryChart } from "@/util/charts";
import { centerToMarker, toUTCTimestamp } from "@/util/markers";
import MarkerNavigation from "./MarkerNavigation";
import useIndicators from "@/hooks/useIndicators";
import { indicatorDefinitionsByKey, IndicatorGraphContext } from "@/util/indicators";

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
  const indicatorSlice = useIndicators();
  const indicatorDefinitionMap = indicatorDefinitionsByKey;
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
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        mouseWheel: false,
        pinch: true,
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
        axisDoubleClickReset: {
          time: true,
          price: true,
        },
      },
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

    // Render indicators on their respective charts using the registry
    Object.entries(groupedIndicators).forEach(([chartIndexStr, chartIndicators]) => {
      const chartIndex = Number(chartIndexStr);
      const chart = charts[chartIndex];
      if (!chart) return;

      chartIndicators.forEach((indicatorInstance) => {
        const value = indicatorInstance.indicator.value;
        const visible = indicatorInstance.indicator.visible;

        if (!visible) return;

        const definition = indicatorDefinitionMap[indicatorInstance.key];
        if (!definition) return;

        const context: IndicatorGraphContext = {
          mainChart,
          chart,
          candles,
          config: value,
          chartIndex,
          chartsWithCCILines,
        };

        definition.createGraph(context);
      });
    });

    // Cleanup
    return () => {
      seriesMarkersApi?.setMarkers?.([]);
      seriesMarkersApi?.detach?.();
      Object.values(charts).forEach((chart) => chart?.remove());
      mainChartRef.current = null;
    };
  }, [
    width,
    height,
    candles,
    indicatorSlice,
    tradeMarkers,
    index,
    indicatorsWithIndex,
    indicatorDefinitionsByKey,
  ]);

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
