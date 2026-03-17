"use client";
import React, { useLayoutEffect, useState } from "react";
import CandlestickChart from "./CandlestickChart";
import { motion } from "framer-motion";
import classes from "./CandlestickChartWrapper.module.css";
import { SeriesMarker, Time } from "lightweight-charts";
import ShowModalButton from "../Input/Indicators/ShowModalButton";
import { candleData } from "@/util/serverFetch";
import { CircularProgress, Stack } from "@mui/joy";
import SymbolButton from "../Input/QuickActions/SymbolButton";

interface CandlestickChartWrapperProps {
  //searchParams: Promise<{ [key: string]: string | undefined }>;
  //onLoad?: () => void;
  tradeMarkers: SeriesMarker<Time>[];
  loading: boolean;
  transformedData: {
    longName: string;
    symbol: string;
    candles: candleData;
  };
  index: number;
  tileIndex: number;
}

const CandlestickChartWrapper: React.FC<CandlestickChartWrapperProps> = ({
  tradeMarkers,
  loading,
  transformedData,
  index,
  tileIndex,
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
      {loading && <div className="loading"><CircularProgress/></div>}
      {!loading && (
        <motion.div
          id="chart"
          tabIndex={index}
          data-testid="chart-wrapper"
          // callback ref — při mountu React zavolá setContainerEl(el)
          ref={(el) => setContainerEl(el)}
          initial={{ opacity: 0, y: -200 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" }}
          className={classes.div}
        >
          <ShowModalButton index={index} className={classes.button} />
          <Stack width={"100%"} gap={2} direction={'row'} justifyContent={'flex-start'} alignItems={'center'}>
            <SymbolButton index={tileIndex}>
              {transformedData.symbol}
            </SymbolButton>
            <h2 className={classes.title}>{transformedData.longName}</h2>
          </Stack>
          <CandlestickChart
            chartContainer={containerEl}
            width={chartWidth}
            index={index}
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
