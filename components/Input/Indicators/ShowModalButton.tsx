import React, { ReactNode } from 'react';
import IndicatorsModal from './IndicatorsModal';
import classes from './ShowModalButton.module.css';
import AnimationButton from '../Buttons/AnimationButton';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, setModal } from '@/store/reduxStore';

interface ShowModalButtonProps {
  children?: ReactNode;
}

const ShowModalButton: React.FC<ShowModalButtonProps> = () => {
  const dispatch = useDispatch();
  const modals = useSelector((state: RootState) => state.modals)
  function handleClick() {
    dispatch(setModal({modal: 'indicators', value: !modals.indicators}))
  }
  return (
    <>
    <AnimationButton className={classes.button} onClick={handleClick}>
      Indicators
    </AnimationButton>
    <IndicatorsModal/>
    </>
  );
};

export default ShowModalButton;