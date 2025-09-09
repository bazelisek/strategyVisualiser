import React, { ReactNode, useRef } from 'react';
import IndicatorsModal from './IndicatorsModal';

interface ShowModalButtonProps {
  children?: ReactNode;
}

const ShowModalButton: React.FC<ShowModalButtonProps> = (props) => {
  const dialogRef = useRef<any>(null);
  function handleClick() {
    dialogRef.current.open()
  }
  return (
    <>
    <button onClick={handleClick}>
      Indicators
    </button>
    <IndicatorsModal ref={dialogRef} />
    </>
  );
};

export default ShowModalButton;