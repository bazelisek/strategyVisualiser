"use client";
import React, { useState, useEffect, useRef } from "react";
import classes from "./Form.module.css";
import { useRouter } from "next/navigation";

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
    const symbolCorrect = formData.symbol.value.length > 0;
    const intervalCorrect = formData.interval.value.length > 0;

    if (
      formData.symbol.timeout &&
      formData.interval.timeout &&
      symbolCorrect &&
      intervalCorrect
    ) {
      const searchParams = new URLSearchParams({
        symbol: formData.symbol.value,
        interval: formData.interval.value,
        duration: formData.duration.value,
        strategy: formData.strategy.value,
      });
      router.replace(`/?${searchParams.toString()}`);
      console.log("✅ URL updated", searchParams.toString());
    }
  }, [formData]);

  return (
    <div className={classes.formDiv}>
      <form>
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
          <input
            type="text"
            name="interval"
            value={formData.interval.value}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Time period</label>
          <select
            name="duration"
            value={formData.duration.value}
            onChange={handleChange}
          >
            <option>5y</option>
            <option>1y</option>
            <option>3mo</option>
            <option>1mo</option>
            <option>1w</option>
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
      </form>

      {/* Debug output to see two-way binding in action */}
      <pre>{JSON.stringify(formData, null, 2)}</pre>
    </div>
  );
};

export default Form;
