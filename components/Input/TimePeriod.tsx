import React, { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";
import CustomSelect from "./CustomSelect";

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
  children,
}) => {
  return (
    <AnimationWrapper handleContinue={handleContinue}>
      <div>
        <h2>Please select the time period you want to chart the graph for.</h2>
        <label>Time period</label>
        <CustomSelect
          onChange={(val) =>
            onChange({ target: { name: "duration", value: val } } as any)
          }
          options={[
            "1d",
            "5d",
            "1mo",
            "3mo",
            "6mo",
            "1y",
            "2y",
            "5y",
            "10y",
            "ytd",
            "max",
          ]}
          value={value}
          initialText="Plese select a time period"
        />
        
        {children}
      </div>
    </AnimationWrapper>
  );
};

export default TimePeriod;
