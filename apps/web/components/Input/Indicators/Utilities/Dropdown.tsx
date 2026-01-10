import { motion } from "framer-motion";
import React, { ReactNode } from "react";
import classes from './Dropdown.module.css'

interface DropdownProps {
  children?: ReactNode;
}

const Dropdown: React.FC<DropdownProps> = (props) => {
  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      exit={{ scaleY: 0, opacity: 0 }}
      transition={{ease: 'easeOut', duration: 0.25}}
      className={classes.dropdown}
    >
      {props.children}
    </motion.div>
  );
};

export default Dropdown;
