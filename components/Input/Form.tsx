"use client";
import React, { useState, useEffect, useRef } from "react";
import classes from "./Form.module.css";
import { useRouter } from "next/navigation";
import { checkFormValidity } from "@/util/formCheck";

interface FormProps {
  children?: React.ReactNode;
}

const Form: React.FC<FormProps> = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    symbol: { value: "", timeout: false },
    interval: { value: "", timeout: false },
    duration: { value: "5y", timeout: false },
    strategy: { value: "DummyStrategy", timeout: false },
  });
  const [error, setError] = useState('');

  const timers = useRef<{ [key: string]: NodeJS.Timeout | null }>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: { ...prev[name as keyof typeof prev], value, timeout: false },
    }));

    if (timers.current[name]) clearTimeout(timers.current[name]!);

    timers.current[name] = setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        [name]: { ...prev[name as keyof typeof prev], timeout: true },
      }));
      timers.current[name] = null;
    }, 500);
  };

  useEffect(() => {
    if (
      !checkFormValidity(formData)
    ) {
      const searchParams = new URLSearchParams({
        symbol: formData.symbol.value,
        interval: formData.interval.value,
        duration: formData.duration.value,
        strategy: formData.strategy.value,
      });
      router.replace(`/?${searchParams.toString()}`);
      console.log("✅ URL updated", searchParams.toString());
      setError('');
    }
    else{
      setError(checkFormValidity(formData));
    }
  }, [formData]);

  return (
    <form className={classes.formDiv}>
      <div>
        <label>Symbol</label>
        <input
          type="text"
          name="symbol"
          value={formData.symbol.value}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Interval</label>
        <select
          name="interval"
          value={formData.interval.value}
          onChange={handleChange}
        >
          <option>1m</option>
          <option>2m</option>
          <option>5m</option>
          <option>15m</option>
          <option>30m</option>
          <option>60m</option>
          <option>90m</option>
          <option>1h</option>
          <option>4h</option>
          <option>1d</option>
          <option>5d</option>
          <option>1wk</option>
          <option>1mo</option>
          <option>3mo</option>
        </select>
      </div>

      <div>
        <label>Time period</label>
        <select
          name="duration"
          value={formData.duration.value}
          onChange={handleChange}
        >
          <option>1d</option>
          <option>5d</option>
          <option>1mo</option>
          <option>3mo</option>
          <option>6mo</option>
          <option>1y</option>
          <option>2y</option>
          <option>5y</option>
          <option>10y</option>
          <option>ytd</option>
          <option>max</option>
        </select>
      </div>

      <div>
        <label>Strategy</label>
        <select
          name="strategy"
          value={formData.strategy.value}
          onChange={handleChange}
        >
          <option>DummyStrategy</option>
          <option>AnotherDummyStrategy</option>
        </select>
      </div>

      {error && <p>{error}</p>}
    </form>
  );
};

export default Form;
