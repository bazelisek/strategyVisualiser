import React, { ReactNode } from 'react';

interface IntervalProps {
  children?: ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  availableIntervals: string[]
}
/*
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
*/

const Interval: React.FC<IntervalProps> = ({value, onChange, availableIntervals}) => {
  return (
    <div>
        <label>Interval</label>
        <select
          name="interval"
          value={value}
          onChange={onChange}
        >
          {availableIntervals.map(value => <option key={value}>{value}</option>)}
        </select>
      </div>
  );
};

export default Interval;