import React, { ReactNode, useState } from "react";
import NewIndicatorDropdown from "./NewIndicatorDropdown";
import DropdownButton from "../Buttons/DropdownButton";
import { useDispatch } from "react-redux";
//import { addIndicator } from "@/store/reduxStore";
import classes from './NewIndicatorButton.module.css';

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
  function handleAddIndicator(indicator: string) {
    //dispatch(addIndicator({ index, indicator }));
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
