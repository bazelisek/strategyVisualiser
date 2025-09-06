import React, { ReactNode } from "react";

interface SymbolProps {
  children?: ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const Symbol: React.FC<SymbolProps> = ({ value, onChange }) => {
  return (
    <div>
      <h2>
        Please enter the symbol code for the stock you want to chart the graph
        for.
      </h2>
      <label>Symbol</label>
      <input type="text" name="symbol" value={value} onChange={onChange} />
    </div>
  );
};

export default Symbol;
