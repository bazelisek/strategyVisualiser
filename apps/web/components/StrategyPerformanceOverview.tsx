import { candleData } from "@/util/serverFetch";
import { getStrategyPerformance } from "@/util/strategyPerformance";
import React, { ReactNode, useState } from "react";
import AnimationButton from "./Input/Buttons/AnimationButton";
import { AnimatePresence, motion } from "framer-motion";
import classes from "./StrategyPerformanceOverview.module.css";

interface StrategyPerformanceOverviewProps {
  children?: ReactNode;
  transformedData: {
    longName: string;
    symbol: string;
    candles: candleData;
  };
  strategyData: {
    time: number;
    amount: number;
  }[];
  strategy: string;
  className?: string;
}

const StrategyPerformanceOverview: React.FC<
  StrategyPerformanceOverviewProps
> = ({ transformedData, strategy, strategyData, className }) => {
  const [open, setOpen] = useState<boolean>(false);
  const performance = getStrategyPerformance(
    strategyData,
    transformedData,
    strategy
  );

  return (
    <motion.div
      // callback ref — při mountu React zavolá setContainerEl(el)
      initial={{ opacity: 0, y: -200 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring" }}
      className={`${className} ${classes.div}`}
    >
      <AnimationButton onClick={() => setOpen((prev) => !prev)} className={classes.button}>
        Strategy Performance Overview{" "}
        <motion.span animate={{ rotate: open ? 180 : 0 , transition: {duration: 0.3}}}>&#x25BC;</motion.span>
      </AnimationButton>
      <AnimatePresence>
        {open && (
          <motion.div
            key="expand"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <h2>Strategy Performance Overview</h2>
            <h3>{strategy}</h3>
            <table>
              <thead>
                <tr>
                  {performance.headers.map((a, index) => (
                    <th key={index}>{a}</th>
                  ))}
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StrategyPerformanceOverview;
