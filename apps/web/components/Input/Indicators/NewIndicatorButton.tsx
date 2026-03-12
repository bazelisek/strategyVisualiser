import React, { ReactNode, useState } from "react";
import NewIndicatorDropdown from "./NewIndicatorDropdown";
import DropdownButton from "../Buttons/DropdownButton";
import { useDispatch } from "react-redux";
//import { addIndicator } from "@/store/reduxStore";
import classes from './NewIndicatorButton.module.css';
import { newIndicators } from "@/store/reduxStore";
import { indicatorState } from "@/store/slices/indicatorSlice";
import type { IndicatorKey } from "@/util/indicators";
import { useTiles } from "@/hooks/useTiles";
import { persistIndicatorAdd } from "@/util/indicators/persistence";
import { createIndicatorId } from "@/util/indicators/identity";

interface NewIndicatorButtonProps {
  children?: ReactNode;
  index: number;
}

const NewIndicatorButton: React.FC<NewIndicatorButtonProps> = ({ index }) => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const { visualizationId } = useTiles();

  function handleNewIndicatorClick() {
    setOpen((old) => !old);
  }
  function handleAddIndicator(indicator: IndicatorKey) {
    const indicatorId = createIndicatorId();
    //dispatch(addIndicator({ index, indicator }));
    dispatch(
      newIndicators({ tileIndex: index, indicatorKey: indicator, indicatorId })
    );
    const baseIndicator = indicatorState[indicator];
    void persistIndicatorAdd({
      visualizationId,
      tileIndex: index,
      indicator: {
        id: indicatorId,
        key: indicator,
        chartIndex: baseIndicator.chartIndex,
        indicator: baseIndicator.indicator,
      },
    });
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
