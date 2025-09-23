import React, { ReactNode, useState } from "react";
import Dropdown from "../Utilities/Dropdown";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicators } from "@/store/reduxStore";
import { HexColorPicker } from "react-colorful";
import ColorPicker from "../Utilities/ColorPicker";

interface SupertrendDropdownProps {
  children?: ReactNode;
  open: boolean;
  index: number;
}

const SupertrendDropdown: React.FC<SupertrendDropdownProps> = ({ index, open }) => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const color = indicators[index].supertrend.value.color;
  const dispatch = useDispatch();

  function handlePeriodChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value && Number(e.target.value) >= 1)
      dispatch(
        setIndicators({
          index,
          indicator: "supertrend",
          value: {
            ...indicators[index].supertrend.value,
            period: Number(e.target.value),
          },
        })
      );
  }
  function handleMultiplierChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value && Number(e.target.value) >= 1)
      dispatch(
        setIndicators({index,
          indicator: "supertrend",
          value: {
            ...indicators[index].supertrend.value,
            multiplier: Number(e.target.value),
          },
        })
      );
  }
  function handleSetColor(newColor: string) {
    dispatch(
      setIndicators({index,
        indicator: "supertrend",
        value: { ...indicators[index].movingAverage.value, color: newColor },
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
              defaultValue={indicators[index].supertrend.value.period}
            />
          </div>
          <div>
            <label htmlFor="supertrend-multiplier">Multiplier</label>
            <input
              type="number"
              id="supertrend-multiplier"
              placeholder=" "
              onChange={handleMultiplierChange}
              defaultValue={indicators[index].supertrend.value.multiplier}
            />
          </div>
          <ColorPicker color={color} setColor={handleSetColor} />
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default SupertrendDropdown;
