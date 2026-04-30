import { motion } from "framer-motion";
import React, { ReactNode, useDeferredValue, useMemo, useState } from "react";
import classes from "./DropdownBox.module.css";

interface DropdownBoxProps {
  children?: ReactNode;
  options: string[];
  onChange: (value: string) => void;
  setOpen: (value: React.SetStateAction<boolean>) => void;
  direction?: "down" | "up"; // 👈 NEW
}

const DropdownBox: React.FC<DropdownBoxProps> = ({
  options,
  onChange,
  setOpen,
  direction = "down", // 👈 default
}) => {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedSearch) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch, options]);

  const animateItems = filteredOptions.length <= 40;

  const listVariants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 10 : -10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: animateItems
        ? { staggerChildren: 0.02, duration: 0.18 }
        : { duration: 0.12 },
    },
    exit: {
      opacity: 0,
      y: direction === "up" ? 10 : -10,
      transition: animateItems
        ? { staggerChildren: 0.01, staggerDirection: -1 }
        : { duration: 0.1 },
    },
  };

  const handleOptionSelect = (option: string) => {
    onChange(option);
    setOpen(false);
    setSearch("");
  };

  return (
    <motion.div
      className={`${classes.optionsListWrapper} ${
        direction === "up" ? classes.up : classes.down
      }`}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={listVariants}
      style={{ zIndex: 3000 }}
    >
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className={classes.searchInput}
        autoFocus
      />

      <ul className={classes.optionsList}>
        {filteredOptions.length === 0 && (
          <li className={classes.noResults}>No results</li>
        )}

        {filteredOptions.map((option, index) =>
          animateItems ? (
            <motion.li
              key={option}
              variants={
                index < 12
                  ? {
                      hidden: { opacity: 0, x: -12 },
                      visible: {
                        opacity: 1,
                        x: 0,
                        transition: { duration: 0.14 },
                      },
                    }
                  : undefined
              }
              onClick={() => handleOptionSelect(option)}
            >
              {option}
            </motion.li>
          ) : (
            <li key={option} onClick={() => handleOptionSelect(option)}>
              {option}
            </li>
          ),
        )}
      </ul>
    </motion.div>
  );
};

export default DropdownBox;
