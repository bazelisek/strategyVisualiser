import React, { ReactNode, useState } from "react";
import Modal from "../Modal";
import { motion } from "framer-motion";
import classes from "./PreconfigureForm.module.css";
import GlobalizeButton from "./Buttons/GlobalizeButton";
import { ConfigKey } from "@/store/slices/configSlice";
import Symbol from "./Form/Symbol";
import Time from "./Form/Time";
import Interval from "./Form/Interval";
import Strategy from "./Form/Strategy";
import { getValidIntervals } from "@/util/formCheck";

interface PreconfigureFormProps {
  children?: ReactNode;
  open: boolean;
  onClose: (formData: {
    symbol: { defaultValue: string },
    interval: { defaultValue: string },
    period1: { defaultValue: string },
    period2: { defaultValue: string },
    strategy: { defaultValue: string },
  }) => void;
}

const PreconfigureForm: React.FC<PreconfigureFormProps> = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    symbol: { defaultValue: "" },
    interval: { defaultValue: "" },
    period1: { defaultValue: "" },
    period2: { defaultValue: "" },
    strategy: { defaultValue: "" },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: { ...prev[name as keyof typeof prev], defaultValue: value },
    }));
  };

  function handleGlobalize(field: ConfigKey) {
    //TODO: Should apply to all existing tiles via url change
  }

  return (
    <>
      <Modal
        title="Indicators"
        className={classes.modal}
        onClose={() => onClose(formData)}
        open={open}
      >
        <motion.ul layout>
          <motion.li layout>
            <Symbol
              value={formData.symbol.defaultValue}
              onChange={handleChange}
              handleContinue={() => {}}
            />
            <GlobalizeButton onClick={() => handleGlobalize("symbol")} />
          </motion.li>
          <motion.li layout>
            <Time
              valueFrom={formData.period1.defaultValue}
              valueTo={formData.period2.defaultValue}
              onChange={handleChange}
              handleContinue={() => {}}
            />
            <div>
              <GlobalizeButton onClick={() => handleGlobalize("period1")} />
              <GlobalizeButton onClick={() => handleGlobalize("period2")} />
            </div>
          </motion.li>
          <motion.li layout>
            <Interval
              value={formData.interval.defaultValue}
              onChange={handleChange}
              availableIntervals={
                formData.period1.defaultValue && formData.period2.defaultValue
                  ? getValidIntervals(
                      new Date(formData.period1.defaultValue),
                      new Date(formData.period2.defaultValue)
                    )
                  : []
              }
              handleContinue={() => {}}
            />
            <GlobalizeButton onClick={() => handleGlobalize("interval")} />
          </motion.li>
          <motion.li layout>
            <Strategy
              value={formData.strategy.defaultValue}
              onChange={handleChange}
              handleContinue={() => {}}
            />
            <GlobalizeButton onClick={() => handleGlobalize("strategy")} />
          </motion.li>
        </motion.ul>
      </Modal>
    </>
  );
};

export default PreconfigureForm;
