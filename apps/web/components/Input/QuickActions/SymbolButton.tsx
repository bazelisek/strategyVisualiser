import React, { ReactNode } from "react";
import AnimationButton from "../Buttons/AnimationButton";
import { motion } from "framer-motion";
import classes from "./SymbolButton.module.css";
import { useModalController } from "@/components/ModalController";

interface SymbolButtonProps {
  children?: ReactNode;
  index: number;
}

const SymbolButton: React.FC<SymbolButtonProps> = ({ index, children }) => {
  const { isOpen, toggle } = useModalController();
  const open = isOpen("symbol", index);
  function handleClick() {
    toggle("symbol", index);
  }
  return (
    <AnimationButton className={classes.button} onClick={handleClick}>
      {children}{" "}
      <motion.span animate={{ rotate: open ? 180 : 0 }}>&#x25BC;</motion.span>
    </AnimationButton>
  );
};

export default SymbolButton;
