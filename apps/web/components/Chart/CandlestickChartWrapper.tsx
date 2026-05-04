"use client";
import React, { useLayoutEffect, useState } from "react";
import CandlestickChart from "./CandlestickChart";
import { motion } from "framer-motion";
import classes from "./CandlestickChartWrapper.module.css";
import { SeriesMarker, Time } from "lightweight-charts";
import ShowModalButton from "../Input/Indicators/ShowModalButton";
import { candleData } from "@/util/serverFetch";
import { Stack, Typography } from "@mui/joy";
import ChartLoading from "../common/ChartLoading";
import Config from "../Input/QuickActions/Config";
import EditableTabs from "../blocks/EditableTabs";

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
  universe: string[];
  index: number;
  handleBackToTileConfig?: () => void;
  selectedSymbol: string | null;
  onSelectedSymbolChange: (symbol: string | null) => void;
}

const CandlestickChartWrapper: React.FC<CandlestickChartWrapperProps> = ({
  tradeMarkers,
  loading,
  transformedData,
  index,
  universe,
  selectedSymbol,
  onSelectedSymbolChange,
  handleBackToTileConfig,
}) => {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(1060);

  useLayoutEffect(() => {
    if (!containerEl) return;

    const updateWidth = () => {
      const w = Math.floor(containerEl.getBoundingClientRect().width);
      if (w && w !== chartWidth) setChartWidth(w);
    };
    updateWidth();

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
      {loading && (
        <div className="loading">
          <ChartLoading />
        </div>
      )}
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
          <div style={{ width: "100%" }}>
            <EditableTabs
              availableTabs={universe.map((item) => ({
                name: item,
                key: item,
              }))}
              selectedTab={selectedSymbol}
              onTabChange={onSelectedSymbolChange}
            />
          </div>
          <Stack
            direction={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
            width={"100%"}
            m={0}
          >
            <Stack
              width={"100%"}
              gap={2}
              direction={"row"}
              justifyContent={"flex-start"}
              alignItems={"center"}
            >
              <Config onClick={handleBackToTileConfig} />
              <h2 className={classes.title}>
                {transformedData.longName || selectedSymbol || "Select a stock"}
              </h2>
            </Stack>
            <div>
              <ShowModalButton index={index} className={classes.button} />
            </div>
          </Stack>
          {!selectedSymbol ? (
            <Typography level="body-md">
              Select a stock tab to load chart data for this strategy run.
            </Typography>
          ) : transformedData.candles.length === 0 ? (
            <Typography level="body-md">
              No chart data is available for the selected stock yet.
            </Typography>
          ) : (
            <CandlestickChart
              chartContainer={containerEl}
              width={chartWidth}
              index={index}
              height={580}
              candles={transformedData.candles}
              tradeMarkers={tradeMarkers}
            />
          )}
        </motion.div>
      )}
    </>
  );
};

export default CandlestickChartWrapper;
