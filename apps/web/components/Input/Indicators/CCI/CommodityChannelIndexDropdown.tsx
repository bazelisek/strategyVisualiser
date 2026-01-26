import { RootState, setIndicators } from "@/store/reduxStore";
import { AnimatePresence } from "framer-motion";
import React, { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import Dropdown from "../Utilities/Dropdown";
import ColorPicker from "../Utilities/ColorPicker";
import useIndicators from "@/hooks/useIndicators";

interface CommodityChannelIndexDropdownProps {
  children?: ReactNode;
  open: boolean;
  indicatorIndex: number;
}

const CommodityChannelIndexDropdown: React.FC<
  CommodityChannelIndexDropdownProps
> = ({ open, indicatorIndex }) => {
  const indicator = useIndicators((indicators) => indicators[indicatorIndex]);
  const color = indicator.indicator.value.color;
  const dispatch = useDispatch();

  function handleCciLengthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value && parseInt(value, 10) >= 1) {
      dispatch(
        setIndicators({
          indicatorIndex,
          value: { cciLength: parseInt(value, 10), color },
        })
      );
    }
  }
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
          <div>
            <label htmlFor="cci-length">Candles to past</label>
            <input
              type="number"
              id="cci-length"
              onChange={handleCciLengthChange}
              defaultValue={
                "cciLength" in indicator.indicator.value
                  ? indicator.indicator.value.cciLength
                  : 20
              }
            />
            <label htmlFor="chart-index">Chart number</label>
            <input
              type="number"
              id="chart-index"
              onChange={handleChartIndexChange}
              defaultValue={
                "chartIndex" in indicator
                  ? indicator.chartIndex
                  : 0
              }
            />
          </div>
          <ColorPicker color={color} setColor={handleSetColor} />
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default CommodityChannelIndexDropdown;
