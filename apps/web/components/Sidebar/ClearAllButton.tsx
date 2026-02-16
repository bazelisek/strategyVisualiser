'use client';
import React, { ReactNode } from 'react';
import AnimationButton from '../Input/Buttons/AnimationButton';
import classes from './ClearAllButton.module.css';
import { clearReduxStorage } from '@/store/reduxStorage';
import useClearState from '@/hooks/useClearAll';

interface ClearAllButtonProps {
  children?: ReactNode;
}

const ClearAllButton: React.FC<ClearAllButtonProps> = (props) => {
    const clear = useClearState();
  return (
    <AnimationButton className={classes.button} onClick={clear}>Clear All</AnimationButton>
  );
};

export default ClearAllButton;