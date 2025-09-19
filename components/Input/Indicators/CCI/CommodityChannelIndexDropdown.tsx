import { RootState, setIndicators } from "@/store/reduxStore";
import { AnimatePresence } from "framer-motion";
import React, { ReactNode, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Dropdown from "../Utilities/Dropdown";
import { HexColorPicker } from "react-colorful";

interface CommodityChannelIndexDropdownProps {
  children?: ReactNode;
  open: boolean;
}

const CommodityChannelIndexDropdown: React.FC<
  CommodityChannelIndexDropdownProps
> = ({ open }) => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const [color, setColor] = useState(
    indicators.commodityChannelIndex.value.color
  );
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
          <HexColorPicker color={color} onChange={setColor} />
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default CommodityChannelIndexDropdown;
