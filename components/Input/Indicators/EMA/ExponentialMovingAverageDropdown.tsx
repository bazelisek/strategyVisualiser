import React, { ReactNode, useState } from "react";
import Dropdown from "../Utilities/Dropdown";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicators } from "@/store/reduxStore";
import { HexColorPicker } from "react-colorful";

interface ExponentialMovingAverageDropdownProps {
  children?: ReactNode;
  open: boolean;
}

const ExponentialMovingAverageDropdown: React.FC<
  ExponentialMovingAverageDropdownProps
> = ({ open }) => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const [color, setColor] = useState(indicators.exponentialMovingAverage.value.color);
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
          <HexColorPicker color={color} onChange={setColor} />
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default ExponentialMovingAverageDropdown;