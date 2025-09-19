import React, { ReactNode, useState } from "react";
import Dropdown from "../Utilities/Dropdown";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicators } from "@/store/reduxStore";
import { HexColorPicker } from "react-colorful";

interface SupertrendDropdownProps {
  children?: ReactNode;
  open: boolean;
}

const SupertrendDropdown: React.FC<SupertrendDropdownProps> = ({ open }) => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const [color, setColor] = useState(indicators.supertrend.value.color);
  const dispatch = useDispatch();

  function handlePeriodChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value && Number(e.target.value) >= 1)
      dispatch(
        setIndicators({
          indicator: "supertrend",
          value: {
            ...indicators.supertrend.value,
            period: Number(e.target.value),
          },
        })
      );
  }
  function handleMultiplierChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value && Number(e.target.value) >= 1)
      dispatch(
        setIndicators({
          indicator: "supertrend",
          value: {
            ...indicators.supertrend.value,
            multiplier: Number(e.target.value),
          },
        })
      );
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
              defaultValue={indicators.supertrend.value.period}
            />
          </div>
          <div>
            <label htmlFor="supertrend-multiplier">Multiplier</label>
            <input
              type="number"
              id="supertrend-multiplier"
              placeholder=" "
              onChange={handleMultiplierChange}
              defaultValue={indicators.supertrend.value.multiplier}
            />
          </div>
          <HexColorPicker color={color} onChange={setColor} />
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default SupertrendDropdown;
