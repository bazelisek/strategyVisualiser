import React, { ReactNode, useRef } from 'react';
import IndicatorsModal from './IndicatorsModal';
import classes from './ShowModalButton.module.css';
import AnimationButton from '../Buttons/AnimationButton';
import { useDispatch } from 'react-redux';
import { setModal } from '@/store/reduxStore';

interface ShowModalButtonProps {
  children?: ReactNode;
}

const ShowModalButton: React.FC<ShowModalButtonProps> = (props) => {
  const dispatch = useDispatch();
  function handleClick() {
    dispatch(setModal({modal: 'indicators', value: true}))
  }
  return (
    <>
    <AnimationButton onClick={handleClick}>
      Indicators
    </AnimationButton>
    <IndicatorsModal/>
    </>
  );
};

export default ShowModalButton;