import React, { ReactNode } from "react";
import Dropdown from "../Utilities/Dropdown";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicators } from "@/store/reduxStore";
import ColorPicker from "../Utilities/ColorPicker";

interface OnBalanceVolumeDropdownProps {
  children?: ReactNode;
  index: number;
  open: boolean;
}

const OnBalanceVolumeDropdown: React.FC<OnBalanceVolumeDropdownProps> = ({
  index,
  open,
}) => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const color = indicators[index].onBalanceVolume.value.color;
  const dispatch = useDispatch();

  function handleSetColor(newColor: string) {
    dispatch(
      setIndicators({
        index,
        indicator: "onBalanceVolume",
        value: { ...indicators[index].onBalanceVolume.value, color: newColor },
      })
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <Dropdown>
          <ColorPicker color={color} setColor={handleSetColor} />
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default OnBalanceVolumeDropdown;
