"use client";
import React, { useState } from "react";
import Symbol from "./Symbol";
import Interval from "./Interval";
import Strategy from "./Strategy";
import { AnimatePresence } from "framer-motion";
import AnimationButton from "../Buttons/AnimationButton";
import Time from "./Time";
import { getValidIntervals } from "@/util/formCheck";
import { useDispatch, useSelector } from "react-redux";
import { newIndicators, RootState } from "@/store/reduxStore";
import useIndicators from "@/hooks/useIndicators";
import { useModalRef } from "../../Modal";
import { createIndicatorId } from "@/util/indicators/identity";

interface FormProps {
  children?: React.ReactNode;
  onClose?: (submittedData: {
    symbol: string;
    interval: string;
    period1: string;
    period2: string;
    //duration: formData.duration.value,
    strategy: string;
  }) => void;
  index: number;
}

const Form: React.FC<FormProps> = ({ onClose, index }) => {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.config);
  const indicators = useIndicators();
  const modalContainerRef = useModalRef() ?? undefined;
  const [formData, setFormData] = useState({
    symbol: { value: config.symbol.defaultValue },
    interval: { value: config.interval.defaultValue },
    period1: { value: config.period1.defaultValue },
    period2: { value: config.period2.defaultValue },
    //duration: { value: "" },
    strategy: { value: config.strategy.defaultValue },
  });
  console.log(JSON.stringify(config));
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

  function handleBack() {
    setCurrentInput((prev) => (prev - 1 < 0 ? 0 : prev - 1));
    setError("");
  }

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
      console.log("Creating with index " + index);
      for (let i = 0; i < indicators.length; i++) {
        // Replace line 78 with:
        const ic = indicators[i];
        if (ic.index != 0) continue;
        dispatch(
          newIndicators({
            state: {
              id: createIndicatorId(),
              index,
              key: ic.key,
              linkedGlobalStateIndex: i,
              indicator: JSON.parse(JSON.stringify(ic.indicator)),
              chartIndex: ic.chartIndex, // Add the chartIndex property
            },
          })
        );
      }

      console.log(JSON.stringify(formData));
      const interval =
        formData.interval.value ||
        getValidIntervals(
          new Date(formData.period1.value),
          new Date(formData.period2.value)
        )[0]; /*validRanges[formData.duration.value][0]*/
      if (onClose)
        onClose({
          symbol: formData.symbol.value,
          interval: interval,
          period1: Math.floor(
            new Date(formData.period1.value).getTime() / 1000
          ).toString(),
          period2: Math.floor(
            new Date(formData.period2.value).getTime() / 1000
          ).toString(),
          //duration: formData.duration.value,
          strategy: formData.strategy.value,
        });
      /*const searchParams = new URLSearchParams({
        symbol: formData.symbol.value,
        interval: interval,
        period1: (Math.floor(new Date(formData.period1.value).getTime()/1000)).toString(),
        period2: (Math.floor(new Date(formData.period2.value).getTime()/1000)).toString(),
        //duration: formData.duration.value,
        strategy: formData.strategy.value,
      });
      router.replace(`/chart?${searchParams.toString()}`);*/
    } else if (currentInput == 1) {
      if (
        !getValidIntervals(
          new Date(formData.period1.value),
          new Date(formData.period2.value)
        ).includes(config.interval.defaultValue)
      ) {
        setFormData((old) => ({ ...old, interval: { value: "" } }));
      }
    }
    setCurrentInput((old) => old + 1);
    setError("");
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
          <Time
            valueFrom={formData.period1.value}
            onChange={handleChange}
            valueTo={formData.period2.value}
            handleContinue={handleContinue}
            modalContainerRef={modalContainerRef}
            key="time-step"
          >
            <AnimationButton onClick={handleBack}>Back</AnimationButton>
            <AnimationButton onClick={handleContinue}>Continue</AnimationButton>
            {error && <p>{error}</p>}
          </Time>
          /*<TimePeriod
            key="time-period-step"
            value={formData.duration.value}
            onChange={handleChange}
            handleContinue={handleContinue}
          >
            <AnimationButton onClick={handleContinue}>Continue</AnimationButton>
            {error && <p>{error}</p>}
          </TimePeriod>*/
        )}

        {currentInput === 2 && (
          <Interval
            key="interval-step"
            value={formData.interval.value}
            onChange={handleChange}
            availableIntervals={
              getValidIntervals(
                new Date(formData.period1.value),
                new Date(formData.period2.value)
              ) /*validRanges[formData.duration.value]*/
            }
            handleContinue={handleContinue}
          >
            <AnimationButton onClick={handleBack}>Back</AnimationButton>
            <AnimationButton onClick={handleContinue}>Continue</AnimationButton>
            {error && <p>{error}</p>}
          </Interval>
        )}

        {currentInput === 3 && (
          <Strategy
            key="strategy-step"
            value={formData.strategy.value}
            onChange={handleChange}
            handleContinue={handleContinue}
          >
            <AnimationButton onClick={handleBack}>Back</AnimationButton>
            <AnimationButton onClick={handleContinue}>Continue</AnimationButton>
            {error && <p>{error}</p>}
          </Strategy>
        )}
      </AnimatePresence>
    </>
  );
};

export default Form;
