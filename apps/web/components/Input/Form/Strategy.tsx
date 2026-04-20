"use client";
import React, { ReactNode, useEffect, useState } from "react";
import AnimationWrapper from "./AnimationWrapper";
import CustomSelect from "./CustomSelect";
import { getAvailableStrategies, type Strategy } from "@/util/strategies/strategies";
import ChartLoading from "@/components/common/ChartLoading";

interface StrategyProps {
  children?: ReactNode;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleContinue: () => void;
  availableStrategies: Strategy[];
  setAvailableStrategies: React.Dispatch<React.SetStateAction<Strategy[]>>;
}

const Strategy: React.FC<StrategyProps> = ({
  value,
  onChange,
  handleContinue,
  children,
  availableStrategies,
  setAvailableStrategies
}) => {
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
                onChange({ target: { name: "strategy", value: val } } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)
              }
              options={availableStrategies.map(str => str.id.toString())}
              mapping={availableStrategies.map(str => str.name)}
              value={availableStrategies.find(strategy => strategy.id === +value)?.name || ''}
              initialText="Plese select a strategy"
            />
            {children}
          </div>
        </AnimationWrapper>
      )}
      {!availableStrategies && <div className="loading"><ChartLoading /></div>}
    </>
  );
};

export default Strategy;
