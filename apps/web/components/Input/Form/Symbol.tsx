import React, { ReactNode } from "react";
import AnimationWrapper from "./AnimationWrapper";
import CustomSelect from "./CustomSelect";
import { getSymbolDisplayLabel, symbols } from "@/util/symbols";
import { Strategy } from "@/util/strategies/strategies";
import { Requirements } from "./Form";

interface SymbolProps {
  children?: ReactNode;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  handleContinue: () => void;
  requirements: Requirements;
}

const Symbol: React.FC<SymbolProps> = ({
  value,
  onChange,
  handleContinue,
  children,
  requirements,
}) => {
  const availableSymbols = requirements.symbol?.whitelist
    ? symbols.filter((symbol) =>
        requirements.symbol?.whitelist?.includes(symbol),
      )
    : requirements.symbol?.blacklist
      ? symbols.filter(
          (symbol) => !requirements.symbol?.blacklist?.includes(symbol),
        )
      : symbols;
  return (
    <AnimationWrapper handleContinue={handleContinue}>
      <div>
        <h2>
          Please select the symbol code for the stock you want to chart the
          graph for.
        </h2>
        <label>Symbol</label>
        <CustomSelect
          onChange={(val) =>
            onChange({
              target: { name: "symbol", value: val },
            } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)
          }
          options={availableSymbols}
          mapping={availableSymbols.map((symbol) => getSymbolDisplayLabel(symbol))}
          value={value}
          initialText="Plese select a symbol"
        />
        {/*<label>Symbol</label>
        <input type="text" name="symbol" value={value} onChange={onChange} />*/}
        {children}
      </div>
    </AnimationWrapper>
  );
};

export default Symbol;
