import React, { ReactNode, useEffect, useMemo, useState } from "react";
import Modal from "../Modal";
import { motion } from "framer-motion";
import classes from "./PreconfigureForm.module.css";
import GlobalizeButton from "./Buttons/GlobalizeButton";
import { ConfigKey, type ConfigState } from "@/store/slices/configSlice";
import Symbol from "./Form/Symbol";
import Time from "./Form/Time";
import Interval from "./Form/Interval";
import Strategy from "./Form/Strategy";
import {
  addToArrayAndHandleEdgeCases,
  getValidIntervals,
} from "@/util/formCheck";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/reduxStore";
import { useTiles } from "@/hooks/useTiles";
import { Requirements } from "./Form/Form";
import { type Strategy as StrategyType } from "@/util/strategies/strategies";

interface PreconfigureFormProps {
  children?: ReactNode;
  open: boolean;
  onClose: (formData: ConfigState) => void;
}

const PreconfigureForm: React.FC<PreconfigureFormProps> = ({
  open,
  onClose,
}) => {
  const config = useSelector((state: RootState) => state.config);
  const [formData, setFormData] = useState<ConfigState>(config);
  const { tiles, setTiles } = useTiles();
  const [availableStrategies, setAvailableStrategies] = useState<
    StrategyType[]
  >([]);
  const requirements: Requirements = JSON.parse(
    availableStrategies.find(
      (str) => str.id.toString() == formData.strategy.defaultValue,
    )?.requirements ?? "{}",
  );

  useEffect(() => {
    if (!open) return;
    setFormData(config);
  }, [open, config]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: { ...prev[name as keyof typeof prev], defaultValue: value },
    }));
  };

  function handleGlobalize(field: ConfigKey) {
    if (tiles.length === 0) return;
    const nextTiles = addToArrayAndHandleEdgeCases(tiles, field, formData);
    setTiles(nextTiles);
  }

  const availableIntervals = useMemo(
    () =>
      formData.period1.defaultValue && formData.period2.defaultValue
        ? getValidIntervals(
            new Date(formData.period1.defaultValue),
            new Date(formData.period2.defaultValue),
          )
        : [
            "1m",
            "2m",
            "5m",
            "15m",
            "30m",
            "60m",
            "90m",
            "1d",
            "5d",
            "1wk",
            "1mo",
            "3mo",
          ],
    [formData.period1.defaultValue, formData.period2.defaultValue],
  );

  const filteredIntervals = useMemo(() => {
    if (requirements.interval?.whitelist?.length) {
      return availableIntervals.filter((interval) =>
        requirements.interval.whitelist?.includes(interval),
      );
    }
    if (requirements.interval?.blacklist?.length) {
      return availableIntervals.filter(
        (interval) => !requirements.interval?.blacklist?.includes(interval),
      );
    }
    return availableIntervals;
  }, [
    availableIntervals,
    requirements.interval?.blacklist,
    requirements.interval?.whitelist,
  ]);

  useEffect(() => {
    const currentInterval = formData.interval.defaultValue;
    if (currentInterval && !filteredIntervals.includes(currentInterval)) {
      setFormData((prev) => ({
        ...prev,
        interval: { ...prev.interval, defaultValue: "" },
      }));
    }
  }, [filteredIntervals, formData.interval.defaultValue]);

  return (
    <>
      <Modal
        title="Indicators"
        className={classes.modal}
        onClose={() => onClose(formData)}
        open={open}
      >
        <motion.ul className={classes.ul} layout>
          <motion.li className={classes.li} layout>
            <Strategy
              value={formData.strategy.defaultValue}
              onChange={handleChange}
              handleContinue={() => {}}
              availableStrategies={availableStrategies}
              setAvailableStrategies={setAvailableStrategies}
            />
            <GlobalizeButton onClick={() => handleGlobalize("strategy")} />
          </motion.li>
          <motion.li className={classes.li} layout>
            <Symbol
              value={formData.symbol.defaultValue}
              onChange={handleChange}
              handleContinue={() => {}}
              requirements={requirements}
              
            />
            <GlobalizeButton onClick={() => handleGlobalize("symbol")} />
          </motion.li>
          <motion.li className={classes.timeLi} layout>
            <div className={classes.left}>
              <Time
                valueFrom={formData.period1.defaultValue}
                valueTo={formData.period2.defaultValue}
                onChange={handleChange}
                handleContinue={() => {}}
              />
            </div>
            <div className={classes.timeButtons}>
              <GlobalizeButton onClick={() => handleGlobalize("period1")} />
              <GlobalizeButton onClick={() => handleGlobalize("period2")} />
            </div>
          </motion.li>
          <motion.li className={classes.li} layout>
            <Interval
              value={formData.interval.defaultValue}
              onChange={handleChange}
              availableIntervals={filteredIntervals}
              handleContinue={() => {}}
              requirements={requirements}
            />
            <GlobalizeButton onClick={() => handleGlobalize("interval")} />
          </motion.li>
          
        </motion.ul>
      </Modal>
    </>
  );
};

export default PreconfigureForm;
