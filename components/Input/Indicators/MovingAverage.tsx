import React, { ReactNode, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicatorsVisibility } from "@/store/reduxStore";
import Switch from "../Buttons/Switch";
import classes from "./MovingAverage.module.css";
import MovingAverageDropdown from "./MovingAverageDropdown";
import DropdownButton from "../Buttons/DropdownButton";

interface MovingAverageProps {
  children?: ReactNode;
}

const MovingAverage: React.FC<MovingAverageProps> = () => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  function handleMovingAverageToggle(value: boolean) {
    dispatch(
      setIndicatorsVisibility({ indicator: "movingAverage", value: value })
    );
  }

  function toggleDropdown() {
    setOpen((old) => !old);
  }

  return (
    <>
      <div className="indicator-selector-div">
        <p>Moving Average</p>
        <div className={classes.alignmentDiv}>
          <DropdownButton onClick={toggleDropdown} />
          <Switch
            isChecked={indicators.movingAverage.visible}
            clickHandler={handleMovingAverageToggle}
          />
        </div>
      </div>
      <MovingAverageDropdown open={open} />
    </>
  );
};

export default MovingAverage;
