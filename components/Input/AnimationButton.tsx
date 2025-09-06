import { motion } from "framer-motion";
import React, { ReactNode, useState } from "react";

interface AnimationButtonProps {
  children?: ReactNode;
  onClick: () => void;
}

const AnimationButton: React.FC<AnimationButtonProps> = ({
  onClick,
  children,
}) => {
  const [hover, setHover] = useState(false);

  return (
    <motion.button
      animate={{scale: hover ? 1.07 : 1}}
      type="button"
      onClick={onClick}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
    >
      {children}
    </motion.button>
  );
};

export default AnimationButton;
