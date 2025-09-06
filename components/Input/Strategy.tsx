import React, { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";
import CustomSelect from "./CustomSelect";

interface StrategyProps {
  children?: ReactNode;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  availableStrategies: string[];
  handleContinue: () => void;
}

const Strategy: React.FC<StrategyProps> = ({
  value,
  onChange,
  availableStrategies,
  handleContinue,
  children,
}) => {
  return (
    <AnimationWrapper handleContinue={handleContinue}>
      <div>
        <h2>
          Please enter the strategy you want to apply on the stock.
        </h2>
        <label>Strategy</label>
        <CustomSelect
          onChange={(val) =>
            onChange({ target: { name: "strategy", value: val } } as any)
          }
          options={availableStrategies}
          value={value}
          initialText="Plese select a strategy"
        />
        {children}
      </div>
    </AnimationWrapper>
  );
};

export default Strategy;
