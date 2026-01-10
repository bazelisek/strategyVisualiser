import React, { ReactNode } from "react";
import Dropdown from "../Utilities/Dropdown";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicators } from "@/store/reduxStore";
import ColorPicker from "../Utilities/ColorPicker";

interface MovingAverageDropdownProps {
  children?: ReactNode;
  indicatorIndex: number;
  open: boolean;
}

const MovingAverageDropdown: React.FC<MovingAverageDropdownProps> = ({
  indicatorIndex,
  open,
}) => {
  const indicator = useSelector(
    (state: RootState) => state.indicators[indicatorIndex]
  );
  const dispatch = useDispatch();

  // Guard against indicators[index] being undefined
  if (!indicator) return null;
  const { color } = indicator.indicator.value;
  

  function handleMaLengthChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value && Number(e.target.value) >= 1)
      dispatch(
        setIndicators({
          indicatorIndex,
          value: { maLength: Number(e.target.value), color },
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
            <label htmlFor="ma-length">Candles to past</label>
            <input
              type="number"
              id="ma-length"
              placeholder=" "
              onChange={handleMaLengthChange}
              defaultValue={"maLength" in indicator.indicator.value ? indicator.indicator.value.maLength : 20}
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

export default MovingAverageDropdown;
