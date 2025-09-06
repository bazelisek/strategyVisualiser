import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import classes from "./CustomSelect.module.css";

interface CustomSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  initialText: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  initialText,
}) => {
  const [open, setOpen] = useState(false);
  const itemStagger = 0.06;
  const baseDuration = 0.1; // minimal time for the roll-down itself

  // Parent variants with staggerChildren
  const listVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: { staggerChildren: itemStagger, duration: baseDuration + itemStagger * options.length },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { staggerChildren: 0.05, staggerDirection: -1 },
    },
  };

  return (
    <div className={classes.wrapper}>
      <div
        className={classes.selectionButton}
        onClick={() => setOpen((old) => !old)}
      >
        {value || initialText}
      </div>

      <AnimatePresence mode="sync">
        {open && (
          <motion.ul
            className={classes.optionsList}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={listVariants} // attach parent variants
          >
            {options.map((option) => (
              <motion.li
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: { type: "spring" },
                  },
                  //exit: { opacity: 0, x: -20, transition: { type: "spring" } },
                }}
                key={option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
