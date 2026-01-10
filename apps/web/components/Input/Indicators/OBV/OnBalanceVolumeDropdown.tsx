import React, { ReactNode } from "react";
import Dropdown from "../Utilities/Dropdown";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicators } from "@/store/reduxStore";
import ColorPicker from "../Utilities/ColorPicker";

interface OnBalanceVolumeDropdownProps {
  children?: ReactNode;
  indicatorIndex: number;
  open: boolean;
}

const OnBalanceVolumeDropdown: React.FC<OnBalanceVolumeDropdownProps> = ({
  indicatorIndex,
  open,
}) => {
  const indicator = useSelector(
    (state: RootState) => state.indicators[indicatorIndex]
  );
  const color = indicator.indicator.value.color;
  const dispatch = useDispatch();

  function handleSetColor(newColor: string) {
    dispatch(
      setIndicators({
        indicatorIndex,
        value: { ...indicator.indicator.value, color: newColor },
      })
    );
  }
  function handleChartIndexChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value && parseInt(value, 10) >= 0) {
      dispatch(
        setIndicators({
          indicatorIndex,
          chartIndex: parseInt(value, 10),
        })
      );
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <Dropdown>
          <label htmlFor="chart-index">Chart number</label>
          <input
            type="number"
            id="chart-index"
            onChange={handleChartIndexChange}
            defaultValue={"chartIndex" in indicator ? indicator.chartIndex : 0}
          />
          <ColorPicker color={color} setColor={handleSetColor} />
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default OnBalanceVolumeDropdown;
