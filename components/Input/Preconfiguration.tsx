import React, { ReactNode, useState } from 'react';
import ShowModalButton from './Indicators/ShowModalButton';
import classes from  "./Preconfiguration.module.css";
import PreconfigureForm from './PreconfigureForm';
import AnimationButton from './Buttons/AnimationButton';
import { useDispatch } from 'react-redux';
import { setConfigs } from '@/store/reduxStore';

interface PreconfigurationProps {
  children?: ReactNode;
}

const Preconfiguration: React.FC<PreconfigurationProps> = (props) => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  function handleClose(formData: {
    symbol: { defaultValue: string },
    interval: { defaultValue: string },
    period1: { defaultValue: string },
    period2: { defaultValue: string },
    strategy: { defaultValue: string },
  }) {
    setOpen(false);
    dispatch(setConfigs(formData));
  }
  function handleClick() {
    setOpen(true);
  }
  return (
    <div>
      <ShowModalButton index={0} className={classes.button} globalButtonEnabled={true}>Ahoj</ShowModalButton>
      <AnimationButton onClick={handleClick} disabled={open}>Tile</AnimationButton>
      <PreconfigureForm onClose={handleClose} open={open} />
    </div>
  );
};

export default Preconfiguration;