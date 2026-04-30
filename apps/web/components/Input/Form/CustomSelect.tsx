import React, { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import classes from "./CustomSelect.module.css";
import DropdownBox from "./DropdownBox";

interface CustomSelectProps {
  options: string[];
  mapping?: string[];
  value: string;
  onChange: (value: string) => void;
  initialText: string;
  direction?: "down" | "up"; // 👈 NEW
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  mapping,
  initialText,
  direction = "down", // 👈 default
}) => {
  const [open, setOpen] = useState(false);
  const displayOptions = useMemo(() => mapping ?? options, [mapping, options]);
  const selectedLabel = useMemo(() => {
    if (!value) return "";
    if (!mapping) return value;
    const selectedIndex = options.indexOf(value);
    return selectedIndex >= 0 ? mapping[selectedIndex] : value;
  }, [mapping, options, value]);
  const displayValueLookup = useMemo(() => {
    if (!mapping) return null;
    return new Map(mapping.map((label, index) => [label, options[index] ?? ""]));
  }, [mapping, options]);

  return (
    <div className={classes.wrapper}>
      <div
        className={classes.selectionButton}
        onClick={() => setOpen((old) => !old)}
      >
        {selectedLabel || initialText}
      </div>

      <AnimatePresence mode="sync">
        {open && (
          <DropdownBox
            direction={direction} // 👈 pass it
            onChange={(value: string) => {
              onChange(displayValueLookup?.get(value) ?? value);
            }}
            options={displayOptions}
            setOpen={setOpen}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
export default CustomSelect;
