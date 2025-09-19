import { RootState, setIndicators } from "@/store/reduxStore";
import { AnimatePresence } from "framer-motion";
import React, { ReactNode, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Dropdown from "../Utilities/Dropdown";
import { HexColorPicker } from "react-colorful";
import ColorPicker from "../Utilities/ColorPicker";

interface CommodityChannelIndexDropdownProps {
  children?: ReactNode;
  open: boolean;
}

const CommodityChannelIndexDropdown: React.FC<
  CommodityChannelIndexDropdownProps
> = ({ open }) => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const color = indicators.commodityChannelIndex.value.color;
  const dispatch = useDispatch();

  function handleCciLengthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value && parseInt(value, 10) >= 1) {
      dispatch(
        setIndicators({
          indicator: "commodityChannelIndex",
          value: { cciLength: parseInt(value, 10), color },
        })
      );
    }
  }
  function handleSetColor(newColor: string) {
    dispatch(
      setIndicators({
        indicator: "commodityChannelIndex",
        value: { ...indicators.movingAverage.value, color: newColor },
      })
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <Dropdown>
          <div>
            <label htmlFor="cci-length">Candles to past</label>
            <input
              type="number"
              id="cci-length"
              onChange={handleCciLengthChange}
              defaultValue={indicators.commodityChannelIndex.value.cciLength}
            />
          </div>
          <ColorPicker color={color} setColor={handleSetColor} />
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default CommodityChannelIndexDropdown;
