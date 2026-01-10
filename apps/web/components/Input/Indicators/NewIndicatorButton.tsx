import React, { ReactNode, useState } from "react";
import NewIndicatorDropdown from "./NewIndicatorDropdown";
import DropdownButton from "../Buttons/DropdownButton";
import { useDispatch } from "react-redux";
//import { addIndicator } from "@/store/reduxStore";
import classes from './NewIndicatorButton.module.css';
import { newIndicators } from "@/store/reduxStore";
import { IndicatorKey } from "@/store/slices/indicatorSlice";

interface NewIndicatorButtonProps {
  children?: ReactNode;
  index: number;
}

const NewIndicatorButton: React.FC<NewIndicatorButtonProps> = ({ index }) => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  function handleNewIndicatorClick() {
    setOpen((old) => !old);
  }
  function handleAddIndicator(indicator: IndicatorKey) {
    //dispatch(addIndicator({ index, indicator }));
    dispatch(newIndicators({tileIndex: index, indicatorKey: indicator }));
    setOpen(false);
  }
  return (
    <div className={classes.wrapper}>
      <DropdownButton onClick={handleNewIndicatorClick}>
        New Indicator
      </DropdownButton>
      {open && <NewIndicatorDropdown onChange={handleAddIndicator} setOpen={setOpen} />}
    </div>
  );
};

export default NewIndicatorButton;
