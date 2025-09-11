import { RootState, setIndicatorsVisibility } from "@/store/reduxStore";
import React, { ReactNode, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import classes from "./ExponentialMovingAverage.module.css";
import DropdownButton from "../Buttons/DropdownButton";
import Switch from "../Buttons/Switch";
import CommodityChannelIndexDropdown from "./CommodityChannelIndexDropdown";

interface CommodityChannelIndexProps {
  children?: ReactNode;
}

const CommodityChannelIndex: React.FC<CommodityChannelIndexProps> = () => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  function handleMovingAverageToggle(value: boolean) {
    dispatch(
      setIndicatorsVisibility({
        indicator: "commodityChannelIndex",
        value: value,
      })
    );
  }

  function toggleDropdown() {
    setOpen((old) => !old);
  }
  return (
    <>
      <div className="indicator-selector-div">
        <p>Commodity Channel Index</p>
        <div className={classes.alignmentDiv}>
          <DropdownButton onClick={toggleDropdown} />
          <Switch
            isChecked={indicators.commodityChannelIndex.visible}
            clickHandler={handleMovingAverageToggle}
          />
        </div>
      </div>
      <CommodityChannelIndexDropdown open={open} />
    </>
  );
};

export default CommodityChannelIndex;
