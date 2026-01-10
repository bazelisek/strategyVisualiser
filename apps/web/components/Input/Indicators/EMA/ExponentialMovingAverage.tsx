import { RootState, setIndicatorsVisibility } from "@/store/reduxStore";
import React, { ReactNode, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DropdownButton from "../../Buttons/DropdownButton";
import Switch from "../../Buttons/Switch";
import ExponentialMovingAverageDropdown from "./ExponentialMovingAverageDropdown";

interface ExponentialMovingAverageProps {
  children?: ReactNode;
  indicatorIndex: number;
}

const ExponentialMovingAverage: React.FC<
  ExponentialMovingAverageProps
> = ({indicatorIndex}) => {
  const indicator = useSelector((state: RootState) => state.indicators[indicatorIndex]);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  function handleMovingAverageToggle(value: boolean) {
    dispatch(
      setIndicatorsVisibility({
        indicatorIndex,
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
        <div className="alignmentDiv">
          <DropdownButton onClick={toggleDropdown} />
          <Switch
            isChecked={indicator?.indicator.visible || false}
            clickHandler={handleMovingAverageToggle}
          />
        </div>
      </div>
      <ExponentialMovingAverageDropdown open={open} indicatorIndex={indicatorIndex} />
    </>
  );
};

export default ExponentialMovingAverage;
