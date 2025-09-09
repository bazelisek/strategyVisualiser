import { setIndicators } from "@/store/reduxStore";
import { AnimatePresence } from "framer-motion";
import React, { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import Dropdown from "./Utilities/Dropdown";

interface CommodityChannelIndexDropdownProps {
  children?: ReactNode;
  open: boolean;
}

const CommodityChannelIndexDropdown: React.FC<
  CommodityChannelIndexDropdownProps
> = ({open}) => {
  const indicators = useSelector((state: any) => state.indicators);
  const dispatch = useDispatch();

  function handleCciLengthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value && parseInt(value, 10) > 1) {
      dispatch(
        setIndicators({
          indicator: "commodityChannelIndex",
          value: { cciLength: parseInt(value, 10) },
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
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default CommodityChannelIndexDropdown;
