import React, { ReactNode } from 'react';
import ShowModalButton from './Indicators/ShowModalButton';
import classes from  "./Preconfiguration.module.css";

interface PreconfigurationProps {
  children?: ReactNode;
}

const Preconfiguration: React.FC<PreconfigurationProps> = (props) => {
  return (
    <div>
      <ShowModalButton index={0} className={classes.button} globalButtonEnabled={true}>Ahoj</ShowModalButton>
      To be added: preconfigure individual fields of Add Tile
    </div>
  );
};

export default Preconfiguration;