import { calculateStrategyPerformance } from "@/util/strategyPerformance";
import React, { ReactNode } from "react";

interface StrategyPerformanceOverviewProps {
  children?: ReactNode;
  transformedData: {
    longName: string;
    symbol: string;
    candles: {
      time: string;
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
  const performance = calculateStrategyPerformance(
    10000,
    strategyData,
    transformedData
  );
  console.log(performance);
  return (
    <>
      <h2>Strategy Performance Overview</h2>
      <h3>{strategy}</h3>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Price</th>
            <th>Average buy price</th>
            <th>Current Capital</th>
            <th>Portfolio Value</th>
            <th>Total Value</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {performance.map(a => (
            <tr key={a.time}>
              <th>{new Date(+a.time * 1000).toLocaleString()}</th>
              <th>{a.price.toFixed(1)}</th>
              <th>{a.avgBuyPrice ? a.avgBuyPrice.toFixed(1) : ''}</th>
              <th>{a.currentCapital.toFixed(1)}</th>
              <th>{a.portfolioValue.toFixed(1)}</th>
              <th>{a.totalValue.toFixed(1)}</th>
              <th>{a.action}</th>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default StrategyPerformanceOverview;
