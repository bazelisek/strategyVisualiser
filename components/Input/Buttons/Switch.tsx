import React, { ReactNode } from "react";
import styles from './Switch.module.css';

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
        <span className={`${styles.slider} ${isChecked ? styles.checked : ""}`}>
          <span className={styles.dot}></span>
        </span>
      </label>
    </>
  );
};

export default Switch;
