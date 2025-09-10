"use client";
import { useSearchParams } from "next/navigation";
import React, { ReactNode } from "react";
import SymbolButton from "./SymbolButton";
import StrategyButton from "./StrategyButton";
import classes from './QuickActions.module.css';

interface QuickActionsProps {
  children?: ReactNode;
}

const QuickActions: React.FC<QuickActionsProps> = (props) => {
  const params = useSearchParams();
  const symbol = params.get("symbol") || "Symbol";
  const strategy = params.get("strategy") || "Strategy";
  
  return (
    <div className={classes.quickActions}>
      <SymbolButton>{symbol}</SymbolButton>
      <StrategyButton>{strategy}</StrategyButton>
    </div>
  );
};

export default QuickActions;
