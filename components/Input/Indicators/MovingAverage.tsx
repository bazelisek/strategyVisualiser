import React, { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setIndicatorsVisibility } from "@/store/reduxStore";
import Switch from "../Buttons/Switch";

interface MovingAverageProps {
  children?: ReactNode;
}

const MovingAverage: React.FC<MovingAverageProps> = (props) => {
  const indicators = useSelector((state: any) => state.indicators);
  const dispatch = useDispatch();
  function handleMovingAverageToggle(value: boolean) {
    dispatch(
      setIndicatorsVisibility({ indicator: "movingAverage", value: value })
    );
  }

  return (
    <div>
      <p>MovingAverage</p>
      <Switch
        isChecked={indicators.movingAverage.visible}
        clickHandler={handleMovingAverageToggle}
      />
    </div>
  );
};

export default MovingAverage;
