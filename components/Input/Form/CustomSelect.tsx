import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import classes from "./CustomSelect.module.css";
import DropdownBox from "./DropdownBox";

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
          <DropdownBox onChange={onChange} options={options} setOpen={setOpen}/>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
