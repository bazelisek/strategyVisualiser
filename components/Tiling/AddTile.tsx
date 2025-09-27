'use client';
import React, { ReactNode, useState } from 'react';
import { useDispatch } from 'react-redux';

interface AddTileProps {
  children?: ReactNode;
  onClick: () => void;
  active?: boolean;
}

const AddTile: React.FC<AddTileProps> = ({onClick, active = true}) => {
    const dispatch = useDispatch();

    function handleAddTile() {
        //dispatch(newIndicators());
        //dispatch addIndicators
        onClick();
    }
  return (
    <>
      <button disabled={!active} onClick={handleAddTile}>
        AddTile
      </button>
    </>
  );
};

export default AddTile;