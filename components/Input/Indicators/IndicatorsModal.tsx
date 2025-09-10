import React, { ReactNode } from "react";
import MovingAverage from "./MovingAverage";
import classes from "./IndicatorsModal.module.css";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import ExponentialMovingAverage from "./ExponentialMovingAverage";
import CommodityChannelIndex from "./CommodityChannelIndex";
import { useDispatch, useSelector } from "react-redux";
import { setModal } from "@/store/reduxStore";

interface IndicatorsModalProps {
  children?: ReactNode;
}

const IndicatorsModal: React.FC<IndicatorsModalProps> = () => {
  const modalSlice = useSelector((state: any) => state.modals);
  const open = modalSlice.indicators;
  const dispatch = useDispatch();

  function handleClose(e: any) {
    e.preventDefault();
    dispatch(setModal({modal: 'indicators', value: false}))
  }

  console.log('pes')
  
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
              <button onClick={handleClose}>&#10005;</button>
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
