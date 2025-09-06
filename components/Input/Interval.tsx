import React, { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";

interface IntervalProps {
  children?: ReactNode;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  availableIntervals: string[];
  handleContinue: () => void;
}
const Interval: React.FC<IntervalProps> = ({
  value,
  onChange,
  availableIntervals,
  handleContinue,
  children,
}) => {
  return (
    <AnimationWrapper handleContinue={handleContinue}>
      <div>
        <label>Interval</label>
        <select name="interval" value={value} onChange={onChange}>
          {availableIntervals.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select> 
        {children}
      </div>
      
    </AnimationWrapper>
  );
};

export default Interval;
