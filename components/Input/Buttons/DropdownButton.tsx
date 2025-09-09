import { motion } from "framer-motion";
import React, { ReactNode, useState } from "react";
import classes from './DropdownButton.module.css';

interface DropdownButtonProps {
  children?: ReactNode;
  onClick?: () => void;
}

const DropdownButton: React.FC<DropdownButtonProps> = (props) => {
  let [rotation, setRotation] = useState(-90);
  function handleClick() {
    setRotation(old => old === -90 ? 0 : -90);
    if (props.onClick) props.onClick();
  }

  return (
    <motion.button className={classes.button} animate={{ rotate: rotation }} onClick={handleClick}>
      &#9660;
    </motion.button>
  );
};

export default DropdownButton;
