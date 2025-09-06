"use client";
import React, { useState } from "react";
import classes from "./Form.module.css";
import { useRouter } from "next/navigation";
import { validRanges } from "@/util/formCheck";
import Symbol from "./Symbol";
import Interval from "./Interval";
import TimePeriod from "./TimePeriod";
import Strategy from "./Strategy";

interface FormProps {
  children?: React.ReactNode;
}

const Form: React.FC<FormProps> = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    symbol: { value: "" },
    interval: { value: "" },
    duration: { value: "1d" },
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
    if (currentInput === 3) {
      console.log(JSON.stringify(formData));
      const interval = formData.interval.value || validRanges[formData.duration.value][0];

      const searchParams = new URLSearchParams({
        symbol: formData.symbol.value,
        interval: interval,
        duration: formData.duration.value,
      });
      router.replace(`/chart?${searchParams.toString()}`);
    }
    setCurrentInput((old) => old + 1);
  }

  return (
    <form
      className={classes.formDiv}
      onSubmit={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // stop default submit
          handleContinue();
        }
      }}
    >
      {currentInput === 0 && (
        <Symbol value={formData.symbol.value} onChange={handleChange} />
      )}

      {currentInput === 1 && (
        <TimePeriod value={formData.duration.value} onChange={handleChange} />
      )}

      {currentInput === 2 && (
        <Interval
          value={formData.interval.value}
          onChange={handleChange}
          availableIntervals={validRanges[formData.duration.value]}
        />
      )}

      {currentInput === 3 && (
        <Strategy
          value={formData.strategy.value}
          onChange={handleChange}
          availableStrategies={["Dummy strategy", "Another dummy strategy"]}
        />
      )}
      <p>{JSON.stringify(formData)}</p>
      <button type="button" onClick={handleContinue}>
        Continue
      </button>
      {error && <p>{error}</p>}
    </form>
  );
};

export default Form;
