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
  const indicatorSlice = useSelector((state: RootState) => state.indicators);
  const chartRef = useRef<HTMLDivElement>(null);
  const cciRef = useRef<HTMLDivElement>(null);
  const obvRef = useRef<HTMLDivElement>(null);

  // New state: store the selected marker’s time (or null if none)
  const [selectedTime, setSelectedTime] = useState<{time: Time, index: number} | null>(null);
  const [mainChart, setMainChart] = useState<IChartApi | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const topHeight =
      indicatorSlice[index]?.commodityChannelIndex.visible ||
      indicatorSlice[index]?.onBalanceVolume.visible
        ? height * 0.7
        : height;
    const bottomHeight =
      indicatorSlice[index]?.commodityChannelIndex.visible ||
      indicatorSlice[index]?.onBalanceVolume.visible
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
    setMainChart(mainChart);

    let cciChart: ReturnType<typeof createChart> | null = null;
    if (
      (indicatorSlice[index]?.commodityChannelIndex.visible || false) &&
      cciRef.current
    ) {
      cciChart = createSecondaryChart(cciRef, mainChart, width, bottomHeight);
    }
    let obvChart: ReturnType<typeof createChart> | null = null;
    if (
      (indicatorSlice[index]?.onBalanceVolume.visible || false) &&
      obvRef.current
    ) {
      obvChart = createSecondaryChart(obvRef, mainChart, width, bottomHeight);
    }

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

    // ** Subscribe to clicks on the chart **
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

      // Find the marker that matches the clicked time (normalized)
      const found = tradeMarkers.findIndex(
        (m) => toUTCTimestamp(m.time) === clickedTime
      );

      if (found !== -1) {
        setSelectedTime({time: tradeMarkers[found].time, index: found});
        centerToMarker(tradeMarkers[found].time, mainChart);
      } else {
        setSelectedTime(null);
      }
    });

    if (indicatorSlice[index]?.movingAverage.visible || false) {
      createMAGraph(
        mainChart,
        indicatorSlice[index]?.movingAverage.value,
        candles
      );
    }
    if (indicatorSlice[index]?.exponentialMovingAverage.visible || false) {
      createEMAGraph(
        mainChart,
        indicatorSlice[index]?.exponentialMovingAverage.value || false,
        candles
      );
    }
    if (indicatorSlice[index]?.commodityChannelIndex.visible || false) {
      createCCIGraph(
        cciChart,
        indicatorSlice[index]?.commodityChannelIndex.value || false,
        candles
      );
    }
    if (indicatorSlice[index]?.supertrend.visible || false) {
      createSTGraph(
        mainChart,
        indicatorSlice[index]?.supertrend.value || false,
        candles
      );
    }
    if (indicatorSlice[index]?.onBalanceVolume.visible || false) {
      createOBVGraph(
        obvChart,
        indicatorSlice[index]?.onBalanceVolume.value || false,
        candles
      );
    }

    return () => {
      seriesMarkersApi?.setMarkers?.([]);
      seriesMarkersApi?.detach?.();
      mainChart.remove();
      cciChart?.remove();
      obvChart?.remove();
    };
  }, [width, height, candles, indicatorSlice[index], tradeMarkers]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div ref={chartRef} />
      {indicatorSlice[index] &&
        indicatorSlice[index]?.commodityChannelIndex.visible && (
          <div ref={cciRef} />
        )}
      {indicatorSlice[index] &&
        indicatorSlice[index]?.onBalanceVolume.visible && <div ref={obvRef} />}

      {/* Show selected marker time */}
      <div style={{ marginTop: "8px", color: "#fff" }}>
        {selectedTime !== null ? (
          <>Selected marker time: {selectedTime.time.toString()}</>
        ) : (
          <>Click a marker to select it</>
        )}
      </div>
      {mainChart && <MarkerNavigation chart={mainChart} selectedTime={selectedTime} setSelectedTime={setSelectedTime} tradeMarkers={tradeMarkers} />}
    </div>
  );
};

export default CandlestickChart;
