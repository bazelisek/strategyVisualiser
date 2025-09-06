import React, { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";

interface SymbolProps {
  children?: ReactNode;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleContinue: () => void;
}

const Symbol: React.FC<SymbolProps> = ({
  value,
  onChange,
  handleContinue,
  children,
}) => {
  return (
    <AnimationWrapper handleContinue={handleContinue}>
      <div>
        <h2>
          Please enter the symbol code for the stock you want to chart the graph
          for.
        </h2>
        <label>Symbol</label>
        <input type="text" name="symbol" value={value} onChange={onChange} />
        {children}
      </div>
      
    </AnimationWrapper>
  );
};

export default Symbol;
