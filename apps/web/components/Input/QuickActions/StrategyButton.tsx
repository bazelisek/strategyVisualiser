import { motion } from "framer-motion";
import React, { ReactNode } from "react";
import AnimationButton from "../Buttons/AnimationButton";
import { useModalController } from "@/components/ModalController";

interface StrategyButtonProps {
  children?: ReactNode;
  index: number;
}

const StrategyButton: React.FC<StrategyButtonProps> = ({ children, index }) => {
  const { isOpen, toggle } = useModalController();
  const open = isOpen("strategy", index);

  function handleClick() {
    toggle("strategy", index);
  }

  return (
    <AnimationButton onClick={handleClick}>
      {children} <motion.span animate={{ rotate: open ? 180 : 0 }}>&#x25BC;</motion.span>
    </AnimationButton>
  );
};

export default StrategyButton;
