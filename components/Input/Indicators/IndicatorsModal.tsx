import React, { ReactNode, useImperativeHandle, useRef } from "react";
import MovingAverage from "./MovingAverage";
import classes from './IndicatorsModal.module.css';

interface IndicatorsModalProps {
  children?: ReactNode;
  ref: any;
}

const IndicatorsModal: React.FC<IndicatorsModalProps> = ({ ref }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useImperativeHandle(ref, () => {
    return {
      open: () => {
        dialogRef.current?.showModal();
      },
      close: () => {
        dialogRef.current?.close();
      },
    };
  });
  return (
    <dialog className={classes.modal} ref={dialogRef}>
      <div className={classes.header}>
        <h2>Indicators</h2>
        <button onClick={() => dialogRef.current?.close()}>&#10005;</button>
      </div>
      <MovingAverage />
    </dialog>
  );
};

export default IndicatorsModal;
