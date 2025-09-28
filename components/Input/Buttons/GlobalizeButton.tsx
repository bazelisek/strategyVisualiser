import React, { ReactNode } from 'react';
import AnimationButton from './AnimationButton';
import { useDispatch } from 'react-redux';
import { makeGlobal } from '@/store/reduxStore';
import { IndicatorKey } from '@/store/slices/indicatorSlice';
import classes from "./GlobalizeButton.module.css";
import { TbWorld } from "react-icons/tb";

interface GlobalizeButtonProps {
  children?: ReactNode;
  onClick: () => void;
}

const GlobalizeButton: React.FC<GlobalizeButtonProps> = ({onClick}) => {    
  return (
    <AnimationButton onClick={onClick} className={classes.button}>
      <TbWorld size={20} color="black" />
    </AnimationButton>
  );
};

export default GlobalizeButton;