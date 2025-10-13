import React, { ReactNode } from 'react';
import { IndicatorKey, indicatorState } from '@/store/slices/indicatorSlice';
import DropdownBox from '../Form/DropdownBox';

interface NewIndicatorDropdownProps {
  children?: ReactNode;
  onChange: (value: IndicatorKey) => void;
  setOpen: (value: React.SetStateAction<boolean>) => void;

}

const NewIndicatorDropdown: React.FC<NewIndicatorDropdownProps> = ({ onChange, setOpen }) => {
    const choices = Object.keys(indicatorState) as IndicatorKey[];
    const displayChoices = choices.map(key => indicatorState[key].displayName);

    function handleChange(displayName: string) {
        const key = choices.find(k => indicatorState[k].displayName === displayName);
        if (key) onChange(key);
    }
  return (
    <DropdownBox options={displayChoices} onChange={handleChange} setOpen={setOpen}/>
  );
};

export default NewIndicatorDropdown;