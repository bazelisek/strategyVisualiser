import React, { ReactNode } from "react";
import classes from "./AnimationWrapper.module.css";
import { motion } from "framer-motion";

interface AnimationWrapperProps {
  children?: ReactNode;
  handleContinue: () => void;
}

const AnimationWrapper: React.FC<AnimationWrapperProps> = ({
  handleContinue,
  children,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -200 }}
      animate={{
        y: 0,
        opacity: 1,
        transition: { duration: 0.5, ease: "easeOut" },
      }}
      exit={{
        y: -200,
        opacity: 0,
        transition: { duration: 0.4, ease: "easeIn" },
      }}
      className={classes.formDiv}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleContinue();
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimationWrapper;
