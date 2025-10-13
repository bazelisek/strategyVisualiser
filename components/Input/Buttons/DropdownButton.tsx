import { motion } from "framer-motion";
import React, { ReactNode, useState } from "react";
import classes from "./DropdownButton.module.css";

interface DropdownButtonProps {
  children?: ReactNode;
  onClick?: () => void;
}

const DropdownButton: React.FC<DropdownButtonProps> = (props) => {
  const [rotation, setRotation] = useState(-90);
  function handleClick() {
    setRotation((old) => (old === -90 ? 0 : -90));
    if (props.onClick) props.onClick();
  }

  return (
    <button className={classes.button} onClick={handleClick}>
      {props.children}
      <motion.span animate={{ rotate: rotation }}>&#9660;</motion.span>
    </button>
  );
};

export default DropdownButton;
