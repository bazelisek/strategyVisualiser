import React, { ReactNode } from "react";
import AnimationButton from "../Buttons/AnimationButton";
import classes from "./RemoveTileButton.module.css";
import useClearState from "@/hooks/useClearAll";

interface ClearTileButtonProps {
  children?: ReactNode;
  index: number;
}

const ClearTileButton: React.FC<ClearTileButtonProps> = ({index}) => {
  const remove = useClearState();
  return (
    <AnimationButton
      className={classes["delete-button"]}
      whileHover={{ scale: 1.05, boxShadow: "1px 1px 15px var(--danger)" }}
      onClick={() => remove(index)}
    >
      Remove Tile
    </AnimationButton>
  );
};

export default ClearTileButton;
