import React, { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";
import CustomSelect from "./CustomSelect";
import { getAvailableStrategies } from "@/util/strategies";
import { symbols } from "@/util/symbols";

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
  const availableSymbols = symbols;
  return (
    <AnimationWrapper handleContinue={handleContinue}>
      <div>
        <h2>
          Please select the symbol code for the stock you want to chart the graph
          for.
        </h2>
        <label>Symbol</label>
        <CustomSelect
          onChange={(val) =>
            onChange({ target: { name: "symbol", value: val } } as any)
          }
          options={availableSymbols}
          value={value}
          initialText="Plese select a smybol"
        />
        {/*<label>Symbol</label>
        <input type="text" name="symbol" value={value} onChange={onChange} />*/}
        {children}
      </div>
    </AnimationWrapper>
  );
};

export default Symbol;
