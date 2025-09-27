import React, { ReactNode } from "react";
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
  chart: IChartApi
}

const MarkerNavigation: React.FC<MarkerNavigationProps> = ({tradeMarkers, selectedTime, setSelectedTime, chart}) => {
    const leftDisabled = selectedTime?.index === 0 || !selectedTime;
    const rightDisabled = selectedTime?.index === tradeMarkers.length - 1 || !selectedTime;

    console.log(leftDisabled);

    function handleLeft() {
        if (selectedTime?.index === 0 || !selectedTime) return;
        const time = {index: selectedTime?.index - 1, time: tradeMarkers[selectedTime?.index - 1].time};
        setSelectedTime({index: selectedTime?.index - 1, time: tradeMarkers[selectedTime?.index - 1].time});
        centerToMarker(time.time, chart)
    }

    function handleRight() {
        if (selectedTime?.index === tradeMarkers.length - 1 || !selectedTime) return;
        const time = {index: selectedTime?.index + 1, time: tradeMarkers[selectedTime?.index + 1].time};
        setSelectedTime({index: selectedTime?.index + 1, time: tradeMarkers[selectedTime?.index + 1].time});
        centerToMarker(time.time, chart)
    }

    
  return (
    <div className={classes.div}>
      <button onClick={handleLeft} disabled={leftDisabled}>🠈</button>
      <button onClick={handleRight} disabled={rightDisabled}>🠊</button>
    </div>
  );
};

export default MarkerNavigation;
