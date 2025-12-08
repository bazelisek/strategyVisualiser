import React, { ReactNode } from "react";
import Dropdown from "../Utilities/Dropdown";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicators } from "@/store/reduxStore";
import ColorPicker from "../Utilities/ColorPicker";

interface SupertrendDropdownProps {
  children?: ReactNode;
  open: boolean;
  indicatorIndex: number;
}

const SupertrendDropdown: React.FC<SupertrendDropdownProps> = ({
  indicatorIndex,
  open,
}) => {
  const indicator = useSelector(
    (state: RootState) => state.indicators[indicatorIndex]
  );
  const color = indicator.indicator.value.color;
  const dispatch = useDispatch();

  function handlePeriodChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value && Number(e.target.value) >= 1)
      dispatch(
        setIndicators({
          indicatorIndex,
          value: {
            ...indicator.indicator.value,
            period: Number(e.target.value),
          },
        })
      );
  }
  function handleMultiplierChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value && Number(e.target.value) >= 1)
      dispatch(
        setIndicators({
          indicatorIndex,
          value: {
            ...indicator.indicator.value,
            multiplier: Number(e.target.value),
          },
        })
      );
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
            <label htmlFor="supertrend-period">Period</label>
            <input
              type="number"
              id="supertrend-period"
              placeholder=" "
              onChange={handlePeriodChange}
              defaultValue={
                "period" in indicator.indicator.value
                  ? indicator.indicator.value.period
                  : 20
              }
            />
          </div>
          <div>
            <label htmlFor="supertrend-multiplier">Multiplier</label>
            <input
              type="number"
              id="supertrend-multiplier"
              placeholder=" "
              onChange={handleMultiplierChange}
              defaultValue={
                "multiplier" in indicator.indicator.value
                  ? indicator.indicator.value.multiplier
                  : 20
              }
            />
          </div>
          {/*<label htmlFor="chart-index">Chart number</label>
          <input
            type="number"
            id="chart-index"
            onChange={handleChartIndexChange}
            defaultValue={"chartIndex" in indicator ? indicator.chartIndex : 0}
          />*/}
          <ColorPicker color={color} setColor={handleSetColor} />
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default SupertrendDropdown;
