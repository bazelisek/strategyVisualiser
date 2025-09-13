import React, { ReactNode } from "react";
import Dropdown from "./Utilities/Dropdown";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicators } from "@/store/reduxStore";

interface MovingAverageDropdownProps {
  children?: ReactNode;
  open: boolean;
}

const MovingAverageDropdown: React.FC<MovingAverageDropdownProps> = ({
  open,
}) => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const dispatch = useDispatch();

  function handleMaLengthChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value && Number(e.target.value) >= 1)
      dispatch(
        setIndicators({
          indicator: "movingAverage",
          value: { maLength: Number(e.target.value) },
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
              defaultValue={indicators.movingAverage.value.maLength}
            />
          </div>
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default MovingAverageDropdown;
