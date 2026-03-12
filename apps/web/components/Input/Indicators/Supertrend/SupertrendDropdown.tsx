import React, { ReactNode } from "react";
import Dropdown from "../Utilities/Dropdown";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicators } from "@/store/reduxStore";
import ColorPicker from "../Utilities/ColorPicker";
import { useTiles } from "@/hooks/useTiles";
import { persistIndicatorEdit } from "@/util/indicators/persistence";
import { toTileIndicator } from "@/util/indicators/serialization";

interface SupertrendDropdownProps {
  children?: ReactNode;
  open: boolean;
  indicatorIndex: number;
}

const SupertrendDropdown: React.FC<SupertrendDropdownProps> = ({
  indicatorIndex,
  open,
}) => {
  const indicator = useSelector(
    (state: RootState) => state.indicators[indicatorIndex]
  );
  const rawColor = indicator.indicator.value.color;
  const color = typeof rawColor === "string" ? rawColor : "#adff29";
  const dispatch = useDispatch();
  const { visualizationId } = useTiles();

  function handlePeriodChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value && Number(e.target.value) >= 1) {
      const nextValue = {
        ...indicator.indicator.value,
        period: Number(e.target.value),
      };
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
  }
  function handleMultiplierChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value && Number(e.target.value) >= 1) {
      const nextValue = {
        ...indicator.indicator.value,
        multiplier: Number(e.target.value),
      };
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
  }
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

  return (
    <AnimatePresence>
      {open && (
        <Dropdown>
          <div>
            <label htmlFor="supertrend-period">Period</label>
            <input
              type="number"
              id="supertrend-period"
              placeholder=" "
              onChange={handlePeriodChange}
              defaultValue={Number(indicator.indicator.value.period ?? 20)}
            />
          </div>
          <div>
            <label htmlFor="supertrend-multiplier">Multiplier</label>
            <input
              type="number"
              id="supertrend-multiplier"
              placeholder=" "
              onChange={handleMultiplierChange}
              defaultValue={Number(indicator.indicator.value.multiplier ?? 20)}
            />
          </div>
          {/*<label htmlFor="chart-index">Chart number</label>
          <input
            type="number"
            id="chart-index"
            onChange={handleChartIndexChange}
            defaultValue={"chartIndex" in indicator ? indicator.chartIndex : 0}
          />*/}
          <ColorPicker color={color} setColor={handleSetColor} />
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default SupertrendDropdown;
