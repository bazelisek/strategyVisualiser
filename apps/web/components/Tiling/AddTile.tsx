'use client';
import React, { ReactNode } from 'react';
import AnimationButton from '../Input/Buttons/AnimationButton';

interface AddTileProps {
  children?: ReactNode;
  onClick: () => void;
  active?: boolean;
}

const AddTile: React.FC<AddTileProps> = ({onClick, active = true}) => {

    function handleAddTile() {
        //dispatch(newIndicators());
        //dispatch addIndicators
        onClick();
    }
  return (
    <>
      <AnimationButton disabled={!active} onClick={handleAddTile}>
        Analyze a Strategy
      </AnimationButton>
    </>
  );
};

export default AddTile;