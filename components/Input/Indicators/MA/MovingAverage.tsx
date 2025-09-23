import React, { ReactNode, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicatorsVisibility } from "@/store/reduxStore";
import Switch from "../../Buttons/Switch";
import classes from "./MovingAverage.module.css";
import MovingAverageDropdown from "./MovingAverageDropdown";
import DropdownButton from "../../Buttons/DropdownButton";

interface MovingAverageProps {
  children?: ReactNode;
  index: number;
}

const MovingAverage: React.FC<MovingAverageProps> = ({index}) => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  function handleMovingAverageToggle(value: boolean) {
    dispatch(
      setIndicatorsVisibility({ indicator: "movingAverage", index, value: value })
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
            isChecked={indicators[index].movingAverage.visible}
            clickHandler={handleMovingAverageToggle}
          />
        </div>
      </div>
      <MovingAverageDropdown index={index} open={open} />
    </>
  );
};

export default MovingAverage;
