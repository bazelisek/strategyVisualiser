import { RootState, setIndicatorsVisibility } from "@/store/reduxStore";
import React, { ReactNode, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import classes from "../EMA/ExponentialMovingAverage.module.css";
import DropdownButton from "../../Buttons/DropdownButton";
import Switch from "../../Buttons/Switch";
import SupertrendDropdown from "./SupertrendDropdown";

interface SupertrendProps {
  children?: ReactNode;
  index: number;
}

const Supertrend: React.FC<SupertrendProps> = ({index}) => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  function handleMovingAverageToggle(value: boolean) {
    dispatch(
      setIndicatorsVisibility({index,
        indicator: "supertrend",
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
        <p>Supertrend</p>
        <div className={classes.alignmentDiv}>
          <DropdownButton onClick={toggleDropdown} />
          <Switch
            isChecked={indicators[index]?.supertrend.visible  || false}
            clickHandler={handleMovingAverageToggle}
          />
        </div>
      </div>
      <SupertrendDropdown index={index} open={open} />
    </>
  );
};

export default Supertrend;
