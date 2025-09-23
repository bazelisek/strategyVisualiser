import { motion } from "framer-motion";
import React, { ReactNode } from "react";
import AnimationButton from "../Buttons/AnimationButton";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setModal } from "@/store/reduxStore";

interface StrategyButtonProps {
  children?: ReactNode;
  index: number;
}

const StrategyButton: React.FC<StrategyButtonProps> = ({ children, index }) => {
  const modals = useSelector((state: RootState) => state.modals);
  const open = modals[index].strategy;
  const dispatch = useDispatch();

  function handleClick() {
    dispatch(setModal({modal: {index, modal: "strategy"}, value: !open}))
  }

  return (
    <AnimationButton onClick={handleClick}>
      {children} <motion.span animate={{ rotate: open ? 180 : 0 }}>&#x25BC;</motion.span>
    </AnimationButton>
  );
};

export default StrategyButton;
