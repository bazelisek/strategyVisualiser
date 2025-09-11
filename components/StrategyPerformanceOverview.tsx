import { getStrategyPerformance } from "@/util/strategyPerformance";
import React, { ReactNode } from "react";

interface StrategyPerformanceOverviewProps {
  children?: ReactNode;
  transformedData: {
    longName: string;
    symbol: string;
    candles: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
    }[];
  };
  strategyData: {
    time: number;
    amount: number;
  }[];
  strategy: string;
}

const StrategyPerformanceOverview: React.FC<
  StrategyPerformanceOverviewProps
> = ({ transformedData, strategy, strategyData }) => {
  const performance = getStrategyPerformance(
    strategyData,
    transformedData,
    strategy
  );

  return (
    <>
      <h2>Strategy Performance Overview</h2>
      <h3>{strategy}</h3>
      <table>
        <thead>
          <tr>
            {performance.headers.map((a, index) => <th key={index}>{a}</th>)}
          </tr>
        </thead>
        <tbody>
          {performance.data.map((a, index) => (
            <tr key={index}>
              {a.map((value, index) => (
                <th key={index}>{value}</th>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default StrategyPerformanceOverview;
