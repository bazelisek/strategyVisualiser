"use client";
import { useSearchParams } from "next/navigation";
import React, { ReactNode } from "react";
import SymbolButton from "./SymbolButton";
import StrategyButton from "./StrategyButton";
import classes from './QuickActions.module.css';

interface QuickActionsProps {
  children?: ReactNode;
  index: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({index}) => {
  const params = useSearchParams();
  const symbol = params.get("symbol") || "Symbol";
  const strategy = params.get("strategy") || "Strategy";
  
  return (
    <div className={classes.quickActions}>
      <SymbolButton index={index}>{symbol}</SymbolButton>
      <StrategyButton index={index}>{strategy}</StrategyButton>
    </div>
  );
};

export default QuickActions;
