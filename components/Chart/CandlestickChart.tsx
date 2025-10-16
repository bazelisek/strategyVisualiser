"use client";

import React, { useEffect, useRef, useState } from "react";
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
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  width,
  height,
  candles,
  index,
  tradeMarkers,
}) => {
  // Select all indicators for this chart
  const indicatorSlice = useSelector((state: RootState) =>
    state.indicators.filter((item) => item.index === index)
  );

  const chartRef = useRef<HTMLDivElement>(null);
  const mainChartRef = useRef<IChartApi | null>(null);

  // Dynamic refs for secondary charts
  const indicatorRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  const [selectedTime, setSelectedTime] = useState<{ time: Time; index: number } | null>(
    null
  );

  useEffect(() => {
    if (!chartRef.current) return;

    // Calculate heights for main and secondary charts
    const hasSecondary = indicatorSlice.some(
      (ind) =>
        (ind.key === "commodityChannelIndex" && ind.indicator.visible) ||
        (ind.key === "onBalanceVolume" && ind.indicator.visible)
    );

    const topHeight = hasSecondary ? height * 0.7 : height;
    const bottomHeight = hasSecondary ? height * 0.3 : 0;

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

    mainChartRef.current = mainChart;

    // Create secondary charts for each indicator
    const secondaryCharts: Record<string, ReturnType<typeof createChart> | null> = {};

    indicatorSlice.forEach((indicator, i) => {
      const id = `${indicator.key}_${i}`;
      if (
        (indicator.key === "commodityChannelIndex" && indicator.indicator.visible) ||
        (indicator.key === "onBalanceVolume" && indicator.indicator.visible)
      ) {
        const ref = indicatorRefs.current[id];
        if (ref) {
          secondaryCharts[id] = createSecondaryChart(
            { current: ref },
            mainChart,
            width,
            bottomHeight
          );
        }
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

    let seriesMarkersApi: ISeriesMarkersPluginApi<Time> | null = null;

    if (tradeMarkers && tradeMarkers.length > 0) {
      seriesMarkersApi = createSeriesMarkers(candleSeries, tradeMarkers);
    }

    // Handle chart click -> marker selection
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

    // Render overlays for all indicators (allow multiple per type)
    indicatorSlice.forEach((indicator, i) => {
      console.log(indicator);
      const id = `${indicator.key}_${i}`;

      if (indicator.key === "movingAverage" && indicator.indicator.visible) {
        if ("maLength" in indicator.indicator.value) {
          createMAGraph(mainChart, indicator.indicator.value, candles);
        }
      }

      if (indicator.key === "exponentialMovingAverage" && indicator.indicator.visible) {
        if ("emaLength" in indicator.indicator.value) {
          console.log("ema");
          createEMAGraph(mainChart, indicator.indicator.value, candles);
        }
      }

      if (indicator.key === "commodityChannelIndex" && indicator.indicator.visible) {
        const chart = secondaryCharts[id];
        if (chart && "cciLength" in indicator.indicator.value) {
          createCCIGraph(chart, indicator.indicator.value, candles);
        }
      }

      if (indicator.key === "supertrend" && indicator.indicator.visible) {
        const value = indicator.indicator.value;
        if (
          value &&
          typeof value === "object" &&
          "multiplier" in value &&
          "period" in value &&
          "color" in value
        ) {
          createSTGraph(
            mainChart,
            {
              multiplier: value.multiplier,
              period: value.period,
              color: value.color,
            },
            candles
          );
        }
      }

      if (indicator.key === "onBalanceVolume" && indicator.indicator.visible) {
        const chart = secondaryCharts[id];
        if (
          chart &&
          "color" in indicator.indicator.value &&
          Object.keys(indicator.indicator.value).length === 1
        ) {
          createOBVGraph(chart, indicator.indicator.value, candles);
        }
      }
    });

    return () => {
      seriesMarkersApi?.setMarkers?.([]);
      seriesMarkersApi?.detach?.();
      mainChart.remove();
      Object.values(secondaryCharts).forEach((chart) => chart?.remove());
      mainChartRef.current = null;
    };
  }, [width, height, candles, indicatorSlice, tradeMarkers]);

  // Render
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div ref={chartRef} />
      {indicatorSlice.map((indicator, i) => {
        const id = `${indicator.key}_${i}`;
        if (
          (indicator.key === "commodityChannelIndex" && indicator.indicator.visible) ||
          (indicator.key === "onBalanceVolume" && indicator.indicator.visible)
        ) {
          return (
            <div
              key={id}
              ref={(el) => {
                indicatorRefs.current[id] = el;
              }}
            />
          );
        }
        return null;
      })}
      <div style={{ marginTop: "8px", color: "#fff" }}>
        {selectedTime !== null ? (
          <>Selected marker time: {selectedTime.time.toString()}</>
        ) : (
          <>Click a marker to select it</>
        )}
      </div>
      {mainChartRef.current && (
        <MarkerNavigation
          chart={mainChartRef.current}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          tradeMarkers={tradeMarkers}
        />
      )}
    </div>
  );
};

export default CandlestickChart;
