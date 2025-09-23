'use client';
import { addModal, newIndicators } from '@/store/reduxStore';
import React, { ReactNode } from 'react';
import { useDispatch } from 'react-redux';

interface AddTileProps {
  children?: ReactNode;
  onClick: () => void;
}

const AddTile: React.FC<AddTileProps> = ({onClick}) => {
    const dispatch = useDispatch();

    function handleAddTile() {
        dispatch(addModal());
        dispatch(newIndicators());
        //dispatch addIndicators
        onClick();
    }
  return (
    <button onClick={handleAddTile}>
      AddTile
    </button>
  );
};

export default AddTile;