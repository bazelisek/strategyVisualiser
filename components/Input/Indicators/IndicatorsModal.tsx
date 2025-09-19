import React, { ReactNode } from "react";
import MovingAverage from "./MA/MovingAverage";
import classes from "./IndicatorsModal.module.css";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import ExponentialMovingAverage from "./EMA/ExponentialMovingAverage";
import CommodityChannelIndex from "./CCI/CommodityChannelIndex";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setModal } from "@/store/reduxStore";
import Supertrend from "./Supertrend/Supertrend";
import OnBalanceVolume from "./OBV/OnBalanceVolume";

interface IndicatorsModalProps {
  children?: ReactNode;
}

const IndicatorsModal: React.FC<IndicatorsModalProps> = () => {
  const modalSlice = useSelector((state: RootState) => state.modals);
  const open = modalSlice.indicators;
  const dispatch = useDispatch();

  function handleClose() {
    dispatch(setModal({modal: 'indicators', value: false}))
  }
  
  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.dialog
            layout
            initial={{ opacity: 0, y: -400 }}
            animate={{ opacity: 1, y: 0, transition: {type: 'spring', ease: 'easeIn', duration: 0.5} }}
            exit={{ opacity: 0, y: -400, transition: {type: 'tween', ease: 'easeIn', duration: 0.25} }}
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
              <motion.li layout>
                <Supertrend />
              </motion.li>
              <motion.li layout>
                <OnBalanceVolume />
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
