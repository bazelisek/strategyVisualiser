import React, { ReactNode, useState } from "react";
import { useDispatch } from "react-redux";
import { setIndicatorsVisibility } from "@/store/reduxStore";
import Switch from "../../Buttons/Switch";
import OnBalanceVolumeDropdown from "./OnBalanceVolumeDropdown";
import DropdownButton from "../../Buttons/DropdownButton";
import useIndicators from "@/hooks/useIndicators";
import { useTiles } from "@/hooks/useTiles";
import { persistIndicatorEdit } from "@/util/indicators/persistence";
import { toTileIndicator } from "@/util/indicators/serialization";
//import classes from "./OnBalanceVolume.module.css";
//import OnBalanceVolumeDropdown from "./OnBalanceVolumeDropdown";
//import DropdownButton from "../Buttons/DropdownButton";

interface OnBalanceVolumeProps {
  children?: ReactNode;
  indicatorIndex: number;
}

const OnBalanceVolume: React.FC<OnBalanceVolumeProps> = ({indicatorIndex}) => {
  const indicator = useIndicators((indicators) => indicators[indicatorIndex]);
  const dispatch = useDispatch();
  const { visualizationId } = useTiles();
  const [open, setOpen] = useState(false);
  function handleOBVToggle(value: boolean) {
    dispatch(
      setIndicatorsVisibility({ indicatorIndex, value: value })
    );
    if (!indicator) return;
    const nextIndicator = {
      ...indicator,
      indicator: { ...indicator.indicator, visible: value },
    };
    void persistIndicatorEdit({
      visualizationId,
      tileIndex: nextIndicator.index,
      indicator: toTileIndicator(nextIndicator),
    });
  }
  
  function toggleDropdown() {
    setOpen((old) => !old);
  }
  
  return (
    <>
      <div className="indicator-selector-div">
        <p>On Balance Volume</p>
        <div className="alignmentDiv">
          <DropdownButton onClick={toggleDropdown} />
          <Switch
            isChecked={indicator?.indicator.visible || false}
            clickHandler={handleOBVToggle}
          />
        </div>
      </div>
      <OnBalanceVolumeDropdown open={open} indicatorIndex={indicatorIndex} />
    </>
  );
};

export default OnBalanceVolume;
