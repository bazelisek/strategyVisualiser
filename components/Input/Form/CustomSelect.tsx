import React, { useState, useMemo } from "react";
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
  const [search, setSearch] = useState("");

  // Filtered options based on search text
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const listVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: { staggerChildren: 0.05, duration: 0.3 },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { staggerChildren: 0.03, staggerDirection: -1 },
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
          <motion.div
            className={classes.optionsListWrapper}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={listVariants}
            style={{ zIndex: 3000 }} // Ensure it's on top of the modal
          >
            {/* Search box */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className={classes.searchInput}
              autoFocus
            />

            {/* Options list */}
            <ul className={classes.optionsList}>
              {filteredOptions.length === 0 && (
                <li className={classes.noResults}>No results</li>
              )}
              {filteredOptions.map((option, index) => (
                <motion.li
                  key={option}
                  variants={
                    index < 12
                      ? {
                          hidden: { opacity: 0, x: -20 },
                          visible: {
                            opacity: 1,
                            x: 0,
                            transition: { type: "spring" },
                          },
                        }
                      : {} // no variants, we’ll control it directly
                  }
                  initial={index < 12 ? undefined : { opacity: 0 }} // start invisible
                  animate={index < 12 ? undefined : { opacity: 1 }} // instantly visible
                  transition={index < 12 ? undefined : { duration: 0 }} // no delay
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {option}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
