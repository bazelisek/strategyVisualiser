"use client";
import { useSearchParams } from "next/navigation";
import React, { ReactNode } from "react";
import SymbolButton from "./SymbolButton";
import StrategyButton from "./StrategyButton";
import classes from "./QuickActions.module.css";
import RemoveTileButton from "./RemoveTileButton";
import { Stack } from "@mui/joy";
import { readTilesFromSearchParams } from "@/util/tilesSearchParams";

interface QuickActionsProps {
  children?: ReactNode;
  index: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({ index }) => {
  const params = useSearchParams();
  const tiles = readTilesFromSearchParams(params);
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
