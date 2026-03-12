'use client';
import React from 'react';
import AnimationButton from '../Input/Buttons/AnimationButton';
import classes from './ClearAllButton.module.css';
import useClearState from '@/hooks/useClearAll';

const ClearAllButton: React.FC = () => {
  const clear = useClearState();
  return (
    <AnimationButton className={classes.button} onClick={() => clear()}>
      Clear All
    </AnimationButton>
  );
};

export default ClearAllButton;
