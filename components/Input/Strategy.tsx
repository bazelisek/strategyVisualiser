import React, { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";

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
        <label>Strategy</label>
        <select name="strategy" value={value} onChange={onChange}>
          {availableStrategies.map((strategy) => (
            <option key={strategy}>{strategy}</option>
          ))}
        </select>
        {children}
      </div>
      
    </AnimationWrapper>
  );
};

export default Strategy;
