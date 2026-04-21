import React, { ReactNode, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import {
  removeIndicator,
  setIndicators,
  setIndicatorsVisibility,
} from "@/store/reduxStore";
import useIndicators from "@/hooks/useIndicators";
import { indicatorDefinitionsByKey } from "@/util/indicators";
import Dropdown from "./Utilities/Dropdown";
import ColorPicker from "./Utilities/ColorPicker";
import DropdownButton from "../Buttons/DropdownButton";
import Switch from "../Buttons/Switch";
import { useTiles } from "@/hooks/useTiles";
import { persistIndicatorDelete, persistIndicatorEdit } from "@/util/indicators/persistence";
import { toTileIndicator } from "@/util/indicators/serialization";
import DeleteButton from "../Buttons/DeleteButton";
import { useGetAuthStatus } from "@/auth/useGetAuthStatus";

interface IndicatorRowProps {
  children?: ReactNode;
  indicatorIndex: number;
}

const IndicatorRow: React.FC<IndicatorRowProps> = ({ indicatorIndex }) => {
  const indicator = useIndicators((indicators) => indicators[indicatorIndex]);
  const definition = indicator
    ? indicatorDefinitionsByKey[indicator.key]
    : undefined;
  const dispatch = useDispatch();
  const { visualizationId } = useTiles();
  const [open, setOpen] = useState(false);
  const { session } = useGetAuthStatus();

  if (!indicator || !definition) return null;

  const value = (indicator.indicator.value ?? {}) as Record<
    string,
    number | string
  >;
  const supportsChartIndex = definition.ui?.supportsChartIndex !== false;

  const persist = (nextIndicator: typeof indicator) => {
    void persistIndicatorEdit({
      visualizationId,
      tileIndex: nextIndicator.index,
      indicator: toTileIndicator(nextIndicator),
    });
  };

  function handleToggle(valueEnabled: boolean) {
    dispatch(
      setIndicatorsVisibility({
        indicatorIndex,
        value: valueEnabled,
      }),
    );
    persist({
      ...indicator,
      indicator: { ...indicator.indicator, visible: valueEnabled },
    });
  }

  function handleParameterChange(key: string, nextValue: number | string) {
    const nextIndicatorValue = { ...value, [key]: nextValue };
    dispatch(
      setIndicators({
        indicatorIndex,
        value: nextIndicatorValue,
      }),
    );
    persist({
      ...indicator,
      indicator: { ...indicator.indicator, value: nextIndicatorValue },
    });
  }

  function handleChartIndexChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextChartIndex = parseInt(e.target.value, 10);
    if (!Number.isFinite(nextChartIndex) || nextChartIndex < 0) return;
    dispatch(
      setIndicators({
        indicatorIndex,
        chartIndex: nextChartIndex,
      }),
    );
    persist({ ...indicator, chartIndex: nextChartIndex });
  }

  function toggleDropdown() {
    setOpen((prev) => !prev);
  }

  return (
    <>
      <div className="indicator-selector-div">
        <p>{definition.displayName}</p>
        <div className="alignmentDiv">
          <DropdownButton onClick={toggleDropdown} />
          <Switch
            isChecked={indicator.indicator.visible}
            clickHandler={handleToggle}
          />
          <div>
                <DeleteButton
                  onClick={() => {
                    dispatch(removeIndicator({ indicatorIndex }));
                    persistIndicatorDelete({
                      visualizationId,
                      indicatorId: indicator.id,
                      indicatorKey: indicator.key,
                      tileIndex: indicator.index,
                    });
                  }}
                />
          </div>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <Dropdown>
            <div>
              {Object.entries(definition.parameters).map(([key, param]) => {
                if (param.type === "color") return null;
                const current = value[key];
                const displayValue =
                  typeof current === "number"
                    ? current
                    : typeof param.default === "number"
                      ? param.default
                      : 0;
                return (
                  <div key={key}>
                    <label htmlFor={`${indicatorIndex}-${key}`}>
                      {param.displayName}
                    </label>
                    <input
                      type="number"
                      id={`${indicatorIndex}-${key}`}
                      min={param.min}
                      value={displayValue}
                      onChange={(e) => {
                        const parsed = Number(e.target.value);
                        if (!parsed || !Number.isFinite(parsed)) return;
                        handleParameterChange(key, parsed);
                      }}
                    />
                  </div>
                );
              })}
              {supportsChartIndex && (
                <div>
                  <label htmlFor={`${indicatorIndex}-chart-index`}>
                    Chart number
                  </label>
                  <input
                    type="number"
                    id={`${indicatorIndex}-chart-index`}
                    min={0}
                    value={indicator.chartIndex}
                    onChange={handleChartIndexChange}
                  />
                </div>
              )}
            </div>
            {Object.entries(definition.parameters).map(([key, param]) => {
              if (param.type !== "color") return null;
              const current = value[key];
              const displayValue =
                typeof current === "string" ? current : String(param.default);
              return (
                <ColorPicker
                  key={key}
                  color={displayValue}
                  setColor={(newColor) => handleParameterChange(key, newColor)}
                />
              );
            })}
          </Dropdown>
        )}
      </AnimatePresence>
    </>
  );
};

export default IndicatorRow;
