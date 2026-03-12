import { setIndicatorsVisibility } from "@/store/reduxStore";
import React, { ReactNode, useState } from "react";
import { useDispatch } from "react-redux";
import DropdownButton from "../../Buttons/DropdownButton";
import Switch from "../../Buttons/Switch";
import CommodityChannelIndexDropdown from "./CommodityChannelIndexDropdown";
import useIndicators from "@/hooks/useIndicators";
import { useTiles } from "@/hooks/useTiles";
import { persistIndicatorEdit } from "@/util/indicators/persistence";
import { toTileIndicator } from "@/util/indicators/serialization";

interface CommodityChannelIndexProps {
  children?: ReactNode;
  indicatorIndex: number;
}

const CommodityChannelIndex: React.FC<CommodityChannelIndexProps> = ({indicatorIndex}) => {
  const indicator = useIndicators((indicators) => indicators[indicatorIndex]);
  const dispatch = useDispatch();
  const { visualizationId } = useTiles();
  const [open, setOpen] = useState(false);
  function handleMovingAverageToggle(value: boolean) {
    dispatch(
      setIndicatorsVisibility({
        indicatorIndex,
        value: value,
      })
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
