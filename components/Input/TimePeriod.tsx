import React, { ReactNode } from 'react';

interface TimePeriodProps {
  children?: ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const TimePeriod: React.FC<TimePeriodProps> = ({value, onChange}) => {
  return (
    <div>
        <h2>Please select the time period you want to chart the graph for.</h2>
        <label>Time period</label>
        <select
          name="duration"
          value={value}
          onChange={onChange}
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
  );
};

export default TimePeriod;