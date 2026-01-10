import { RootState, setIndicatorsVisibility } from "@/store/reduxStore";
import React, { ReactNode, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DropdownButton from "../../Buttons/DropdownButton";
import Switch from "../../Buttons/Switch";
import SupertrendDropdown from "./SupertrendDropdown";

interface SupertrendProps {
  children?: ReactNode;
  indicatorIndex: number;
}

const Supertrend: React.FC<SupertrendProps> = ({indicatorIndex}) => {
  const indicator = useSelector((state: RootState) => state.indicators[indicatorIndex]);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  function handleMovingAverageToggle(value: boolean) {
    dispatch(
      setIndicatorsVisibility({indicatorIndex,
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
        <div className="alignmentDiv">
          <DropdownButton onClick={toggleDropdown} />
          <Switch
            isChecked={indicator?.indicator.visible  || false}
            clickHandler={handleMovingAverageToggle}
          />
        </div>
      </div>
      <SupertrendDropdown indicatorIndex={indicatorIndex} open={open} />
    </>
  );
};

export default Supertrend;
