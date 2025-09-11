"use client";
import React, { ReactNode, useEffect, useState } from "react";
import AnimationWrapper from "./AnimationWrapper";
import CustomSelect from "./CustomSelect";
import { getAvailableStrategies } from "@/util/strategies";

interface StrategyProps {
  children?: ReactNode;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleContinue: () => void;
}

const Strategy: React.FC<StrategyProps> = ({
  value,
  onChange,
  handleContinue,
  children,
}) => {
  const [availableStrategies, setAvailableStrategies] = useState<string[]>([]);
  useEffect(() => {
    async function handleFetch() {
      setAvailableStrategies(await getAvailableStrategies());
    }
    handleFetch();
  }, []);

  return (
    <>
      {availableStrategies && (
        <AnimationWrapper handleContinue={handleContinue}>
          <div>
            <h2>Please select the strategy you want to apply on the stock.</h2>
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
      )}
      {!availableStrategies && <p>Loading...</p>}
    </>
  );
};

export default Strategy;
