import React, { ReactNode } from 'react';
import IndicatorsModal from './IndicatorsModal';
import classes from './ShowModalButton.module.css';
import AnimationButton from '../Buttons/AnimationButton';
import { useDispatch, useSelector } from 'react-redux';
import { newIndicators, RootState, setModal } from '@/store/reduxStore';

interface ShowModalButtonProps {
  children?: ReactNode;
  index: number;
}

const ShowModalButton: React.FC<ShowModalButtonProps> = ({index}) => {
  const dispatch = useDispatch();
  const modals = useSelector((state: RootState) => state.modals)
  function handleClick() {
    dispatch(newIndicators(index))
    dispatch(setModal({modal: {modal: 'indicators', index: index}, value: !modals[index]?.indicators || false}))
  }
  return (
    <>
    <AnimationButton className={classes.button} onClick={handleClick}>
      Indicators
    </AnimationButton>
    <IndicatorsModal index={index}/>
    </>
  );
};

export default ShowModalButton;