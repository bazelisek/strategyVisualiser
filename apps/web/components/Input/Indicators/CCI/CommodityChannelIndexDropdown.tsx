import { setIndicators } from "@/store/reduxStore";
import { AnimatePresence } from "framer-motion";
import React, { ReactNode } from "react";
import { useDispatch } from "react-redux";
import Dropdown from "../Utilities/Dropdown";
import ColorPicker from "../Utilities/ColorPicker";
import useIndicators from "@/hooks/useIndicators";
import { useTiles } from "@/hooks/useTiles";
import { persistIndicatorEdit } from "@/util/indicators/persistence";
import { toTileIndicator } from "@/util/indicators/serialization";

interface CommodityChannelIndexDropdownProps {
  children?: ReactNode;
  open: boolean;
  indicatorIndex: number;
}

const CommodityChannelIndexDropdown: React.FC<
  CommodityChannelIndexDropdownProps
> = ({ open, indicatorIndex }) => {
  const indicator = useIndicators((indicators) => indicators[indicatorIndex]);
  const rawColor = indicator.indicator.value.color;
  const color = typeof rawColor === "string" ? rawColor : "#f829ff";
  const dispatch = useDispatch();
  const { visualizationId } = useTiles();

  function handleCciLengthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value && parseInt(value, 10) >= 1) {
      const nextValue = {
        ...indicator.indicator.value,
        cciLength: parseInt(value, 10),
        color,
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
          <div>
            <label htmlFor="cci-length">Candles to past</label>
            <input
              type="number"
              id="cci-length"
              onChange={handleCciLengthChange}
              defaultValue={Number(indicator.indicator.value.cciLength ?? 20)}
            />
            <label htmlFor="chart-index">Chart number</label>
            <input
              type="number"
              id="chart-index"
              onChange={handleChartIndexChange}
              defaultValue={
                "chartIndex" in indicator
                  ? indicator.chartIndex
                  : 0
              }
            />
          </div>
          <ColorPicker color={color} setColor={handleSetColor} />
        </Dropdown>
      )}
    </AnimatePresence>
  );
};

export default CommodityChannelIndexDropdown;
