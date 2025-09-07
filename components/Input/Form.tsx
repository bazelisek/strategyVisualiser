"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { validRanges } from "@/util/formCheck";
import Symbol from "./Symbol";
import Interval from "./Interval";
import TimePeriod from "./TimePeriod";
import Strategy from "./Strategy";
import { AnimatePresence } from "framer-motion";
import AnimationButton from "./AnimationButton";

interface FormProps {
  children?: React.ReactNode;
}

const Form: React.FC<FormProps> = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    symbol: { value: "" },
    interval: { value: "" },
    duration: { value: "" },
    strategy: { value: "" },
  });
  const [error, setError] = useState("");
  const [currentInput, setCurrentInput] = useState(0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: { ...prev[name as keyof typeof prev], value },
    }));
  };

  function handleContinue() {
    const value = formData.symbol.value;
    if (
      currentInput === 0 &&
      (value.length === 0 || value.toUpperCase() !== value)
    ) {
      setError("Incorrect symbol");
      return;
    }
    if (Object.values(formData).filter((p) => p.value).length <= currentInput) {
      setError("Please select a value.");
      return;
    }
    if (currentInput === 3) {
      console.log(JSON.stringify(formData));
      const interval =
        formData.interval.value || validRanges[formData.duration.value][0];

      const searchParams = new URLSearchParams({
        symbol: formData.symbol.value,
        interval: interval,
        duration: formData.duration.value,
        strategy: formData.strategy.value,
      });
      router.replace(`/chart?${searchParams.toString()}`);
    }
    setCurrentInput((old) => old + 1);
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {currentInput === 0 && (
          <Symbol
            key="symbol-step"
            value={formData.symbol.value}
            onChange={handleChange}
            handleContinue={handleContinue}
          >
            <AnimationButton onClick={handleContinue}>Continue</AnimationButton>
            {error && <p>{error}</p>}
          </Symbol>
        )}

        {currentInput === 1 && (
          <TimePeriod
            key="time-period-step"
            value={formData.duration.value}
            onChange={handleChange}
            handleContinue={handleContinue}
          >
            <AnimationButton onClick={handleContinue}>Continue</AnimationButton>
            {error && <p>{error}</p>}
          </TimePeriod>
        )}

        {currentInput === 2 && (
          <Interval
            key="interval-step"
            value={formData.interval.value}
            onChange={handleChange}
            availableIntervals={validRanges[formData.duration.value]}
            handleContinue={handleContinue}
          >
            <AnimationButton onClick={handleContinue}>Continue</AnimationButton>
            {error && <p>{error}</p>}
          </Interval>
        )}

        {currentInput === 3 && (
          <Strategy
            key="strategy-step"
            value={formData.strategy.value}
            onChange={handleChange}
            availableStrategies={["Dummy strategy", "Another dummy strategy"]}
            handleContinue={handleContinue}
          >
            <AnimationButton onClick={handleContinue}>Continue</AnimationButton>
            {error && <p>{error}</p>}
          </Strategy>
        )}
      </AnimatePresence>
    </>
  );
};

export default Form;
