import React, { ReactNode } from 'react';
import AnimationButton from './AnimationButton';
import { useDispatch } from 'react-redux';
import { makeGlobal } from '@/store/reduxStore';
import { IndicatorKey } from '@/store/slices/indicatorSlice';
import classes from "./GlobalizeButton.module.css";
import { TbWorld } from "react-icons/tb";

interface GlobalizeButtonProps {
  children?: ReactNode;
  indicator: IndicatorKey;
}

const GlobalizeButton: React.FC<GlobalizeButtonProps> = ({indicator}) => {
    const dispatch = useDispatch();
    function handleClick() {
        console.log("Making global");
        console.log(indicator)
        dispatch(makeGlobal({indicator}))
    }
  return (
    <AnimationButton onClick={handleClick} className={classes.button}>
      <TbWorld size={20} color="black" />
    </AnimationButton>
  );
};

export default GlobalizeButton;