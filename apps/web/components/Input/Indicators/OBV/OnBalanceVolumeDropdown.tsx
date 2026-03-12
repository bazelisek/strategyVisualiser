import React, { ReactNode } from "react";
import Dropdown from "../Utilities/Dropdown";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicators } from "@/store/reduxStore";
import ColorPicker from "../Utilities/ColorPicker";
import { useTiles } from "@/hooks/useTiles";
import { persistIndicatorEdit } from "@/util/indicators/persistence";
import { toTileIndicator } from "@/util/indicators/serialization";

interface OnBalanceVolumeDropdownProps {
  children?: ReactNode;
  indicatorIndex: number;
  open: boolean;
}

const OnBalanceVolumeDropdown: React.FC<OnBalanceVolumeDropdownProps> = ({
  indicatorIndex,
  open,
}) => {
  const indicator = useSelector(
    (state: RootState) => state.indicators[indicatorIndex]
  );
  const rawColor = indicator.indicator.value.color;
  const color = typeof rawColor === "string" ? rawColor : "#2962FF";
  const dispatch = useDispatch();
  const { visualizationId } = useTiles();

  function handleSetColor(newColor: string) {
    const nextValue = { ...indicator.indicator.value, color: newColor };
    dispatch(
      setIndicators({
        indicatorIndex,
        value: nextValue,
      })
    );
    const nextIndicator = {
      ...indicator,
      indicator: { ...indicator.indicator, value: nextValue },
    };
    void persistIndicatorEdit({
      visualizationId,
      tileIndex: nextIndicator.index,
      indicator: toTileIndicator(nextIndicator),
    });
  }
  function handleChartIndexChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value && parseInt(value, 10) >= 0) {
      const nextChartIndex = parseInt(value, 10);
      dispatch(
        setIndicators({
          indicatorIndex,
          chartIndex: nextChartIndex,
        })
      );
      const nextIndicator = {
        ...indicator,
        chartIndex: nextChartIndex,
      };
      void persistIndicatorEdit({
        visualizationId,
        tileIndex: nextIndicator.index,
        indicator: toTileIndicator(nextIndicator),
      });
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <Dropdown>
          <label htmlFor="chart-index">Chart number</label>
          <input
            type="number"
            id="chart-index"
            onChange={handleChartIndexChange}
            defaultValue={"chartIndex" in indicator ? indicator.chartIndex : 0}
          />
          <ColorPicker color={color} setColor={handleSetColor} />
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default OnBalanceVolumeDropdown;
