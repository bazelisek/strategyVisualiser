import React, { ReactNode, useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import classes from "./ColorPicker.module.css";

interface ColorPickerProps {
  children?: ReactNode;
  setColor: (newColor: string) => void;
  color: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, setColor }) => {
  const [active, setActive] = useState(false);
  const popup = useRef<HTMLDivElement | null>(null);
  function onColorChange(newColor: string) {
    setColor(newColor);
  }
  useEffect(() => {
    if (!active) return;

    function handleClickOutside(e: MouseEvent) {
      if (popup.current && !popup.current.contains(e.target as Node)) {
        setActive(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [active]);
  return (
    <>
      {active && (
        <div className={classes.div} ref={popup}>
          <HexColorPicker color={color} onChange={onColorChange} />
          <label htmlFor="hex-colorPicker">Hex</label>
          <input
            id="hex-colorPicker"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
          />
        </div>
      )}
      <button onClick={() => setActive(true)}>
        <div className={classes.color} style={{ backgroundColor: color }} />
      </button>
    </>
  );
};

export default ColorPicker;
