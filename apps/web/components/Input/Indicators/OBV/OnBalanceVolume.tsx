import React, { ReactNode, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicatorsVisibility } from "@/store/reduxStore";
import Switch from "../../Buttons/Switch";
import OnBalanceVolumeDropdown from "./OnBalanceVolumeDropdown";
import DropdownButton from "../../Buttons/DropdownButton";
import useIndicators from "@/hooks/useIndicators";
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
  const [open, setOpen] = useState(false);
  function handleOBVToggle(value: boolean) {
    dispatch(
      setIndicatorsVisibility({ indicatorIndex, value: value })
    );
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
