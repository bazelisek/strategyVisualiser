import React, { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";
import CustomSelect from "./CustomSelect";

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
        <h2>
          Please enter an interval of chart data records.
        </h2>
        <label>Interval</label>
        <CustomSelect
          onChange={(val) => onChange({ target: { name: "interval", value: val } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)}
          options={availableIntervals}
          value={value}
          initialText="Plese select an interval"
        />
        {children}
      </div>
      
    </AnimationWrapper>
  );
};

export default Interval;
