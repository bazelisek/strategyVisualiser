import React, { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setIndicators, setIndicatorsVisibility } from "@/store/reduxStore";
import Switch from "../Buttons/Switch";
import classes from './MovingAverage.module.css';

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
  function handleMaLengthChange(e: any) {
    if (e.target.value && e.target.value > 1)
      dispatch(setIndicators({indicator: "movingAverage", value: {maLength: e.target.value}}))
  }

  return (
    <div className="indicator-selector-div">
      <p>MovingAverage</p>
      <div className={classes.alignmentDiv}>
        <div className={classes.inputWrapper}>
        <input type='number' id='ma-length' placeholder=" " onChange={handleMaLengthChange}/>
        <label htmlFor="ma-length">Candles to past</label>
        </div>
        <Switch
          isChecked={indicators.movingAverage.visible}
          clickHandler={handleMovingAverageToggle}
        />
      </div>
    </div>
  );
};

export default MovingAverage;
