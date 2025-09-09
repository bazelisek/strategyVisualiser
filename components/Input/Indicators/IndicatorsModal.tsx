import React, { ReactNode, useImperativeHandle, useRef, useState } from "react";
import MovingAverage from "./MovingAverage";
import classes from "./IndicatorsModal.module.css";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import ExponentialMovingAverage from "./ExponentialMovingAverage";
import CommodityChannelIndex from "./CommodityChannelIndex";

interface IndicatorsModalProps {
  children?: ReactNode;
  ref: any;
}

const IndicatorsModal: React.FC<IndicatorsModalProps> = ({ ref }) => {
  const [open, setOpen] = useState(false);
  useImperativeHandle(ref, () => {
    return {
      open: () => {
        setOpen(true);
      },
      close: () => {
        setOpen(false);
      },
    };
  });
  function handleClose(e: any) {
    e.preventDefault();
    setOpen(false);
  }
  
  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.dialog
            layout
            initial={{ opacity: 0, y: -200 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -200 }}
            open
            className={classes.modal}
            onClose={handleClose}
          >
            <div className={classes.header}>
              <h2>Indicators</h2>
              <button onClick={() => setOpen(false)}>&#10005;</button>
            </div>
            <motion.ul layout>
              <motion.li layout>
                <MovingAverage />
              </motion.li>
              <motion.li layout>
                <ExponentialMovingAverage />
              </motion.li>
              <motion.li layout>
                <CommodityChannelIndex />
              </motion.li>
            </motion.ul>
          </motion.dialog>
        )}
      </AnimatePresence>
    </>,
    document.getElementById("main")!
  );
};

export default IndicatorsModal;
