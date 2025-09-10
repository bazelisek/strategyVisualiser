import React, { ReactNode, useState } from "react";
import AnimationButton from "../Buttons/AnimationButton";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { setModal } from "@/store/reduxStore";

interface SymbolButtonProps {
  children?: ReactNode;
}

const SymbolButton: React.FC<SymbolButtonProps> = ({ children }) => {
  const dispatch = useDispatch();
  const modals = useSelector((state: any) => state.modals);
  const open = modals.symbol;
  function handleClick() {
    dispatch(setModal({modal: 'symbol', value: !open}))
  }
  return (
    <AnimationButton onClick={handleClick}>
      {children}{" "}
      <motion.span animate={{ rotate: open ? 180 : 0 }}>&#x25BC;</motion.span>
    </AnimationButton>
  );
};

export default SymbolButton;
