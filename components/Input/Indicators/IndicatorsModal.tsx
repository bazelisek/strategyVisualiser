import React, { ReactNode, useImperativeHandle, useRef } from "react";
import MovingAverage from "./MovingAverage";

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
    <dialog ref={dialogRef}>
      <h2>Dialog</h2>
      <MovingAverage />
    </dialog>
  );
};

export default IndicatorsModal;
