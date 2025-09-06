import React, { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";

interface TimePeriodProps {
  children?: ReactNode;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleContinue: () => void;
}

const TimePeriod: React.FC<TimePeriodProps> = ({
  value,
  onChange,
  handleContinue,
  children
}) => {
  return (
    <AnimationWrapper handleContinue={handleContinue}>
      <div>
        <h2>Please select the time period you want to chart the graph for.</h2>
        <label>Time period</label>
        <select name="duration" value={value} onChange={onChange}>
          <option>1d</option>
          <option>5d</option>
          <option>1mo</option>
          <option>3mo</option>
          <option>6mo</option>
          <option>1y</option>
          <option>2y</option>
          <option>5y</option>
          <option>10y</option>
          <option>ytd</option>
          <option>max</option>
        </select>
        {children}
      </div>
    </AnimationWrapper>
  );
};

export default TimePeriod;
