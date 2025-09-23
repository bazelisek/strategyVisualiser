import React, { ReactNode } from "react";
import Dropdown from "../Utilities/Dropdown";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicators } from "@/store/reduxStore";
import ColorPicker from "../Utilities/ColorPicker";

interface MovingAverageDropdownProps {
  children?: ReactNode;
  index: number;
  open: boolean;
}

const MovingAverageDropdown: React.FC<MovingAverageDropdownProps> = ({
  index,
  open,
}) => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const color = indicators[index].movingAverage.value.color;
  const dispatch = useDispatch();

  function handleMaLengthChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value && Number(e.target.value) >= 1)
      dispatch(
        setIndicators({
          index,
          indicator: "movingAverage",
          value: { maLength: Number(e.target.value), color },
        })
      );
  }

  function handleSetColor(newColor: string) {
    dispatch(
      setIndicators({
        index,
        indicator: "movingAverage",
        value: { ...indicators[index].movingAverage.value, color: newColor },
      })
    );
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
              defaultValue={indicators[index].movingAverage.value.maLength}
            />
          </div>
          <ColorPicker color={color} setColor={handleSetColor} />
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default MovingAverageDropdown;
