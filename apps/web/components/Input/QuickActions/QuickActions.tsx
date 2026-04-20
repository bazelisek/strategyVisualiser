"use client";
import React, { ReactNode } from "react";
import StrategyButton from "./StrategyButton";
import classes from "./QuickActions.module.css";
import RemoveTileButton from "./RemoveTileButton";
import { Stack } from "@mui/joy";
import { useTiles } from "@/hooks/useTiles";
import { useStrategyName } from "@/hooks/useStrategyName";

interface QuickActionsProps {
  children?: ReactNode;
  index: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({ index }) => {
  const { tiles } = useTiles();
  const tile = tiles[index];
  const strategyName = useStrategyName(tile?.strategy ?? "");

  return (
    <div className={classes.quickActions}>
      <Stack sx={{ flexDirection: "row", justifyContent: "space-between" }}>
        <div>
          <StrategyButton index={index}>
            {strategyName ?? `${tile?.strategy}`}
          </StrategyButton>
        </div>
        <div>
          <RemoveTileButton index={index} />
        </div>
      </Stack>
    </div>
  );
};

export default QuickActions;
