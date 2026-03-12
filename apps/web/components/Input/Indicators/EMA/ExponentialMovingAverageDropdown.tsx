import React, { ReactNode} from "react";
import Dropdown from "../Utilities/Dropdown";
import { AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { setIndicators } from "@/store/reduxStore";
import ColorPicker from "../Utilities/ColorPicker";
import useIndicators from "@/hooks/useIndicators";
import { useTiles } from "@/hooks/useTiles";
import { persistIndicatorEdit } from "@/util/indicators/persistence";
import { toTileIndicator } from "@/util/indicators/serialization";

interface ExponentialMovingAverageDropdownProps {
  children?: ReactNode;
  open: boolean;
  indicatorIndex: number
}

const ExponentialMovingAverageDropdown: React.FC<
  ExponentialMovingAverageDropdownProps
> = ({ open, indicatorIndex }) => {
  const indicator = useIndicators((indicators) => indicators[indicatorIndex]);
  const rawColor = indicator.indicator.value.color;
  const color = typeof rawColor === "string" ? rawColor : "#29f8ff";
  const dispatch = useDispatch();
  const { visualizationId } = useTiles();

  function handleEmaLengthChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value && parseInt(value, 10) >= 1) {
      const nextValue = {
        ...indicator.indicator.value,
        emaLength: parseInt(value, 10),
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
            <label htmlFor="ema-length">Candles to past</label>
            <input
              type="number"
              id="ema-length"
              onChange={handleEmaLengthChange}
              defaultValue={Number(indicator.indicator.value.emaLength ?? 20)}
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

export default ExponentialMovingAverageDropdown;
