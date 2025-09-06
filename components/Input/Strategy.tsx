import React, { ReactNode } from "react";

interface StrategyProps {
  children?: ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  availableStrategies: string[];
}

const Strategy: React.FC<StrategyProps> = ({value, onChange, availableStrategies}) => {
  return (
    <div>
      <label>Strategy</label>
      <select
        name="strategy"
        value={value}
        onChange={onChange}
      >
        {availableStrategies.map(strategy => <option key={strategy}>{strategy}</option>)}
      </select>
    </div>
  );
};

export default Strategy;
