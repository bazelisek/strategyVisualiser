"use client";

import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  createChart,
  CrosshairMode,
  ColorType,
  UTCTimestamp,
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

  useEffect(() => {
    if (!chartRef.current || !indicatorSlice[index]) return;

    const topHeight =
      indicatorSlice[index].commodityChannelIndex.visible ||
      indicatorSlice[index].onBalanceVolume.visible
        ? height * 0.7
        : height;
    const bottomHeight =
      indicatorSlice[index].commodityChannelIndex.visible ||
      indicatorSlice[index].onBalanceVolume.visible
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
    if (indicatorSlice[index].commodityChannelIndex.visible && cciRef.current) {
      cciChart = createSecondaryChart(cciRef, mainChart, width, bottomHeight);
    }
    let obvChart: ReturnType<typeof createChart> | null = null;
    if (indicatorSlice[index].onBalanceVolume.visible && obvRef.current) {
      obvChart = createSecondaryChart(obvRef, mainChart, width, bottomHeight);
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

    if (indicatorSlice[index].movingAverage.visible) {
      createMAGraph(mainChart, indicatorSlice[index].movingAverage.value, candles);
    }
    if (indicatorSlice[index].exponentialMovingAverage.visible) {
      createEMAGraph(
        mainChart,
        indicatorSlice[index].exponentialMovingAverage.value,
        candles
      );
    }
    if (indicatorSlice[index].commodityChannelIndex.visible) {
      createCCIGraph(
        cciChart,
        indicatorSlice[index].commodityChannelIndex.value,
        candles
      );
    }
    if (indicatorSlice[index].supertrend.visible) {
      createSTGraph(mainChart, indicatorSlice[index].supertrend.value, candles);
    }
    if (indicatorSlice[index].onBalanceVolume.visible) {
      createOBVGraph(obvChart, indicatorSlice[index].onBalanceVolume.value, candles);
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
      {indicatorSlice[index] && indicatorSlice[index].commodityChannelIndex.visible && <div ref={cciRef} />}
      {indicatorSlice[index] && indicatorSlice[index].onBalanceVolume.visible && <div ref={obvRef} />}
    </div>
  );
};

export default CandlestickChart;
