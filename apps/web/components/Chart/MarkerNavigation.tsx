import React, { ReactNode, useCallback, useEffect } from "react";
import classes from "./MarkerNavigation.module.css";
import { IChartApi, SeriesMarker, Time } from "lightweight-charts";
import { centerToMarker } from "@/util/markers";

interface MarkerNavigationProps {
  children?: ReactNode;
  tradeMarkers: SeriesMarker<Time>[];
  selectedTime: { time: Time; index: number } | null;
  setSelectedTime: React.Dispatch<
    React.SetStateAction<{
      time: Time;
      index: number;
    } | null>
  >;
  chart: IChartApi;
  chartContainer: HTMLDivElement | null;
}

const MarkerNavigation: React.FC<MarkerNavigationProps> = ({
  tradeMarkers,
  selectedTime,
  setSelectedTime,
  chart,
  chartContainer,
}) => {
  const leftDisabled = selectedTime?.index === 0 || !selectedTime;
  const rightDisabled =
    selectedTime?.index === tradeMarkers.length - 1 || !selectedTime;

  const handleLeft = useCallback(() => {
    if (selectedTime?.index === 0 || !selectedTime) return;
    const newIndex = selectedTime.index - 1;
    const newMarker = { index: newIndex, time: tradeMarkers[newIndex].time };
    setSelectedTime(newMarker);
    centerToMarker(newMarker.time, chart);
  }, [chart, selectedTime, setSelectedTime, tradeMarkers]);

  const handleRight = useCallback(() => {
    if (selectedTime?.index === tradeMarkers.length - 1 || !selectedTime)
      return;
    const newIndex = selectedTime.index + 1;
    const newMarker = { index: newIndex, time: tradeMarkers[newIndex].time };
    setSelectedTime(newMarker);
    centerToMarker(newMarker.time, chart);
  }, [chart, selectedTime, setSelectedTime, tradeMarkers]);

  // register a keydown listener that uses the latest disabled flags and chart reference
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight" && !rightDisabled) {
        handleRight();
      } else if (event.key === "ArrowLeft" && !leftDisabled) {
        handleLeft();
      }
    }

    if (!chartContainer) return;
    chartContainer.addEventListener("keydown", handleKeyDown);
    return () => {
      chartContainer.removeEventListener("keydown", handleKeyDown);
    };
    // re-register whenever these values change so the handler has fresh closures
  }, [
    leftDisabled,
    rightDisabled,
    selectedTime?.index,
    tradeMarkers.length,
    chartContainer,
    handleLeft,
    handleRight,
  ]);

  return (
    <div className={classes.div}>
      <button onClick={handleLeft} disabled={leftDisabled}>
        🠈
      </button>
      <button onClick={handleRight} disabled={rightDisabled}>
        🠊
      </button>
    </div>
  );
};

export default MarkerNavigation;
