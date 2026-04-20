import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import classes from "./CustomSelect.module.css";
import DropdownBox from "./DropdownBox";

interface CustomSelectProps {
  options: string[];
  mapping?: string[];
  value: string;
  onChange: (value: string) => void;
  initialText: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  mapping,
  initialText,
}) => {
  const [open, setOpen] = useState(false);

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
          <DropdownBox onChange={(value: string) => {mapping ? onChange(options[mapping.indexOf(value)]):onChange(value)}} options={mapping ?? options} setOpen={setOpen}/>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
