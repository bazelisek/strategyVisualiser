"use client";
import { useSearchParams } from "next/navigation";
import React, { ReactNode } from "react";
import SymbolButton from "./SymbolButton";
import StrategyButton from "./StrategyButton";
import classes from './QuickActions.module.css';
import { useSelector } from "react-redux";
import { RootState } from "@/store/reduxStore";

interface QuickActionsProps {
  children?: ReactNode;
  index: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({index}) => {
  const charts = useSelector((state: RootState )=> state.charts);
  const params = charts[index];
  const symbol = params.symbol;
  const strategy = params.strategy;
  
  return (
    <div className={classes.quickActions}>
      <SymbolButton index={index}>{symbol}</SymbolButton>
      <StrategyButton index={index}>{strategy}</StrategyButton>
    </div>
  );
};

export default QuickActions;
