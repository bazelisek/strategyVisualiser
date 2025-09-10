import { motion } from "framer-motion";
import React, { ReactNode } from "react";
import classes from "./AnimationButton.module.css";

interface AnimationButtonProps {
  children?: ReactNode;
  onClick?: () => void;
}

const AnimationButton: React.FC<AnimationButtonProps> = ({
  onClick,
  children,
}) => {
  return (
    <motion.button
      animate={{ scale: 1, boxShadow: "none" }}
      whileHover={{ scale: 1.05, boxShadow: "1px 1px 15px var(--accent)" }}
      onClick={onClick}
      className={classes.button}
    >
      {children}
    </motion.button>
  );
};

export default AnimationButton;
