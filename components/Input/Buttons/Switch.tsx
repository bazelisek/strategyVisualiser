import React, { ReactNode } from "react";
import styles from "./Switch.module.css";
import { motion } from "framer-motion";

interface SwitchProps {
  children?: ReactNode;
  isChecked: boolean;
  clickHandler: (value: boolean) => void;
}

const Switch: React.FC<SwitchProps> = ({ isChecked, clickHandler }) => {
  const handleCheckboxChange = () => {
    clickHandler(!isChecked);
  };

  return (
    <>
      <label className={styles.switch}>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
          className={styles.checkbox}
        />
        <motion.span
          animate={{
            backgroundColor: isChecked ? "#4ade80" : "var(--background-light)",
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className={`${styles.slider} ${isChecked ? styles.checked : ""}`}
        >
          <motion.span
            animate={{
              x: isChecked ? "24px" : "0",
              backgroundColor: isChecked
                ? "var(--background-light)"
                : "var(--foreground)",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className={styles.dot}
          />
        </motion.span>
      </label>
    </>
  );
};

export default Switch;
