import { RootState, setIndicatorsVisibility } from "@/store/reduxStore";
import React, { ReactNode, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DropdownButton from "../../Buttons/DropdownButton";
import Switch from "../../Buttons/Switch";
import CommodityChannelIndexDropdown from "./CommodityChannelIndexDropdown";
import useIndicators from "@/hooks/useIndicators";

interface CommodityChannelIndexProps {
  children?: ReactNode;
  indicatorIndex: number;
}

const CommodityChannelIndex: React.FC<CommodityChannelIndexProps> = ({indicatorIndex}) => {
  const indicator = useIndicators((indicators) => indicators[indicatorIndex]);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  function handleMovingAverageToggle(value: boolean) {
    dispatch(
      setIndicatorsVisibility({
        indicatorIndex,
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
        <div className="alignmentDiv">
          <DropdownButton onClick={toggleDropdown} />
          <Switch
            isChecked={indicator?.indicator.visible || false}
            clickHandler={handleMovingAverageToggle}
          />
        </div>
      </div>
      <CommodityChannelIndexDropdown indicatorIndex={indicatorIndex} open={open} />
    </>
  );
};

export default CommodityChannelIndex;
