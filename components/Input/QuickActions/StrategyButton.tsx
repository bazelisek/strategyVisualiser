import { motion } from "framer-motion";
import React, { ReactNode, useState } from "react";
import AnimationButton from "../Buttons/AnimationButton";
import { useDispatch, useSelector } from "react-redux";
import { setModal } from "@/store/reduxStore";

interface StrategyButtonProps {
  children?: ReactNode;
}

const StrategyButton: React.FC<StrategyButtonProps> = ({ children }) => {
  const modals = useSelector((state: any) => state.modals);
  const open = modals.strategy;
  const dispatch = useDispatch();

  function handleClick() {
    dispatch(setModal({modal: "strategy", value: !open}))
  }

  return (
    <AnimationButton onClick={handleClick}>
      {children} <motion.span animate={{ rotate: open ? 180 : 0 }}>&#x25BC;</motion.span>
    </AnimationButton>
  );
};

export default StrategyButton;
