"use client";
import React, { useLayoutEffect, useState } from "react";
import CandlestickChart from "./CandlestickChart";
import { motion } from "framer-motion";
import classes from "./CandlestickChartWrapper.module.css";
import { SeriesMarker, Time } from "lightweight-charts";
import ShowModalButton from "../Input/Indicators/ShowModalButton";

interface CandlestickChartWrapperProps {
  //searchParams: Promise<{ [key: string]: string | undefined }>;
  //onLoad?: () => void;
  tradeMarkers: SeriesMarker<Time>[];
  loading: boolean;
  transformedData: {
    longName: string;
    symbol: string;
    candles: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
    }[];
  };
  error: string;
}

const CandlestickChartWrapper: React.FC<CandlestickChartWrapperProps> = ({
  tradeMarkers,
  loading,
  transformedData,
  error,
}) => {
  // místo useRef:
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(1060); // fallback

  // useLayoutEffect se spustí až když se callback-ref nastaví (containerEl != null)
  useLayoutEffect(() => {
    if (!containerEl) return;

    // inicialní měření (okamžitě)
    const updateWidth = () => {
      const w = Math.floor(containerEl.getBoundingClientRect().width);
      if (w && w !== chartWidth) setChartWidth(w);
    };
    updateWidth();

    // pozorovatel pro změny velikosti
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          const w = Math.floor(entry.contentRect.width);
          setChartWidth(w);
        }
      }
    });

    observer.observe(containerEl);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerEl]); // závislost právě na elementu

  return (
    <>
      {loading && !error && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && (
        <motion.div
          // callback ref — při mountu React zavolá setContainerEl(el)
          ref={(el) => setContainerEl(el)}
          initial={{ opacity: 0, y: -200 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" }}
          className={classes.div}
        > 
          <ShowModalButton />
          <h2>{transformedData.longName}</h2>
          <h3>{transformedData.symbol}</h3>
          <CandlestickChart
            width={chartWidth}
            height={580}
            candles={transformedData.candles}
            tradeMarkers={tradeMarkers}
          />
        </motion.div>
      )}
    </>
  );
};

export default CandlestickChartWrapper;
