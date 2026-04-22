import React, { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";
import CustomSelect from "./CustomSelect";
import { Requirements } from "./Form";

interface IntervalProps {
  children?: ReactNode;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  availableIntervals: string[];
  handleContinue: () => void;
  requirements: Requirements;
}
const Interval: React.FC<IntervalProps> = ({
  value,
  onChange,
  availableIntervals,
  handleContinue,
  children,
  requirements
}) => {
  const finalAvailableIntervals = requirements.interval?.whitelist
      ? availableIntervals.filter((interval) =>
          requirements.interval?.whitelist?.includes(interval),
        )
      : requirements.interval?.blacklist
        ? availableIntervals.filter(
            (interval) => !requirements.interval?.blacklist?.includes(interval),
          )
        : availableIntervals;
  return (
    <AnimationWrapper handleContinue={handleContinue}>
      <div>
        <h2>Please enter an interval of chart data records.</h2>
        <label>Interval</label>
        <CustomSelect
          onChange={(val) =>
            onChange({
              target: { name: "interval", value: val },
            } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)
          }
          options={finalAvailableIntervals}
          value={value}
          initialText="Plese select an interval"
        />
        {children}
      </div>
    </AnimationWrapper>
  );
};

export default Interval;
