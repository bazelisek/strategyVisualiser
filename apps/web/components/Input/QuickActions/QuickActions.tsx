"use client";
import React, { ReactNode } from "react";
import SymbolButton from "./SymbolButton";
import StrategyButton from "./StrategyButton";
import classes from "./QuickActions.module.css";
import RemoveTileButton from "./RemoveTileButton";
import { Stack } from "@mui/joy";
import { useTiles } from "@/hooks/useTiles";

interface QuickActionsProps {
  children?: ReactNode;
  index: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({ index }) => {
  const { tiles } = useTiles();
  const tile = tiles[index];

  return (
    <div className={classes.quickActions}>
      <Stack sx={{ flexDirection: "row", justifyContent: "space-between" }}>
        <div>
          <SymbolButton index={index}>{tile?.symbol}</SymbolButton>
          <StrategyButton index={index}>{tile?.strategy}</StrategyButton>
        </div>
        <div>
          <RemoveTileButton index={index} />
        </div>
      </Stack>
    </div>
  );
};

export default QuickActions;
