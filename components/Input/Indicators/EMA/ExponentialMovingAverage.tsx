import { RootState, setIndicatorsVisibility } from "@/store/reduxStore";
import React, { ReactNode, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import classes from "./ExponentialMovingAverage.module.css";
import DropdownButton from "../../Buttons/DropdownButton";
import Switch from "../../Buttons/Switch";
import ExponentialMovingAverageDropdown from "./ExponentialMovingAverageDropdown";

interface ExponentialMovingAverageProps {
  children?: ReactNode;
}

const ExponentialMovingAverage: React.FC<
  ExponentialMovingAverageProps
> = () => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  function handleMovingAverageToggle(value: boolean) {
    dispatch(
      setIndicatorsVisibility({
        indicator: "exponentialMovingAverage",
        value: value,
      })
    );
  }

  function toggleDropdown() {
    setOpen((old) => !old);
  }
  return (
    <>
      <div className="indicator-selector-div">
        <p>Exponential Moving Average</p>
        <div className={classes.alignmentDiv}>
          <DropdownButton onClick={toggleDropdown} />
          <Switch
            isChecked={indicators.exponentialMovingAverage.visible}
            clickHandler={handleMovingAverageToggle}
          />
        </div>
      </div>
      <ExponentialMovingAverageDropdown open={open} />
    </>
  );
};

export default ExponentialMovingAverage;
