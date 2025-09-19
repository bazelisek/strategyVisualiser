import React, { ReactNode} from "react";
import Dropdown from "../Utilities/Dropdown";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicators } from "@/store/reduxStore";
import ColorPicker from "../Utilities/ColorPicker";

interface ExponentialMovingAverageDropdownProps {
  children?: ReactNode;
  open: boolean;
}

const ExponentialMovingAverageDropdown: React.FC<
  ExponentialMovingAverageDropdownProps
> = ({ open }) => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const color = indicators.exponentialMovingAverage.value.color;
  const dispatch = useDispatch();

  function handleEmaLengthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value && parseInt(value, 10) >= 1) {
      dispatch(
        setIndicators({
          indicator: "exponentialMovingAverage",
          value: { emaLength: parseInt(value, 10), color },
        })
      );
    }
  }
  function handleSetColor(newColor: string) {
    dispatch(
      setIndicators({
        indicator: "exponentialMovingAverage",
        value: { ...indicators.movingAverage.value, color: newColor },
      })
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <Dropdown>
          <div>
            <label htmlFor="ema-length">Candles to past</label>
            <input
              type="number"
              id="ema-length"
              onChange={handleEmaLengthChange}
              defaultValue={indicators.exponentialMovingAverage.value.emaLength}
            />
          </div>
          <ColorPicker color={color} setColor={handleSetColor} />
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default ExponentialMovingAverageDropdown;
