import React, { ReactNode, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicatorsVisibility } from "@/store/reduxStore";
import Switch from "../../Buttons/Switch";
import MovingAverageDropdown from "./MovingAverageDropdown";
import DropdownButton from "../../Buttons/DropdownButton";
import { useTiles } from "@/hooks/useTiles";
import { persistIndicatorEdit } from "@/util/indicators/persistence";
import { toTileIndicator } from "@/util/indicators/serialization";

interface MovingAverageProps {
  children?: ReactNode;
  indicatorIndex: number;
}

const MovingAverage: React.FC<MovingAverageProps> = ({ indicatorIndex }) => {
  const indicator = useSelector(
    (state: RootState) => state.indicators[indicatorIndex]
  );
  const dispatch = useDispatch();
  const { visualizationId } = useTiles();
  const [open, setOpen] = useState(false);
  function handleMovingAverageToggle(value: boolean) {
    dispatch(setIndicatorsVisibility({ indicatorIndex, value: value }));
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
        <p>Moving Average</p>
        <div className="alignmentDiv">
          <DropdownButton onClick={toggleDropdown} />
          <Switch
            isChecked={indicator?.indicator.visible || false}
            clickHandler={handleMovingAverageToggle}
          />
        </div>
      </div>
      <MovingAverageDropdown indicatorIndex={indicatorIndex} open={open} />
    </>
  );
};

export default MovingAverage;
