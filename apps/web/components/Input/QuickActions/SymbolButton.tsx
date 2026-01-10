import React, { ReactNode } from "react";
import AnimationButton from "../Buttons/AnimationButton";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setModal } from "@/store/reduxStore";

interface SymbolButtonProps {
  children?: ReactNode;
  index: number;
}

const SymbolButton: React.FC<SymbolButtonProps> = ({ index, children }) => {
  const dispatch = useDispatch();
  const modals = useSelector((state: RootState) => state.modals);
  const open = modals[index]?.symbol || false;
  function handleClick() {
    dispatch(setModal({modal: {index, modal: 'symbol'}, value: !open}))
  }
  return (
    <AnimationButton onClick={handleClick}>
      {children}{" "}
      <motion.span animate={{ rotate: open ? 180 : 0 }}>&#x25BC;</motion.span>
    </AnimationButton>
  );
};

export default SymbolButton;
