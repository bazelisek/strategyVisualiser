import React, { ReactNode } from "react";
import MovingAverage from "./MA/MovingAverage";
import classes from "./IndicatorsModal.module.css";
import { motion } from "framer-motion";
import ExponentialMovingAverage from "./EMA/ExponentialMovingAverage";
import CommodityChannelIndex from "./CCI/CommodityChannelIndex";
import { useDispatch, useSelector } from "react-redux";
import { makeGlobal, RootState, setModal } from "@/store/reduxStore";
import Supertrend from "./Supertrend/Supertrend";
import OnBalanceVolume from "./OBV/OnBalanceVolume";
import Modal from "@/components/Modal";
import GlobalizeButton from "../Buttons/GlobalizeButton";
import { IndicatorKey } from "@/store/slices/indicatorSlice";

interface IndicatorsModalProps {
  children?: ReactNode;
  index: number;
  globalButtonEnabled?: boolean;
}

const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  index,
  globalButtonEnabled
}) => {
  const modalSlice = useSelector((state: RootState) => state.modals);
  const open = modalSlice[index]?.indicators || false;
  const dispatch = useDispatch();

  function handleClose() {
    dispatch(setModal({ modal: { index, modal: "indicators" }, value: false }));
  }

  function handleClick(indicator: IndicatorKey) {
        console.log("Making global");
        console.log(indicator)
        dispatch(makeGlobal({indicator}))
    }

  return (
    <>
      <Modal
        title="Indicators"
        className={classes.modal}
        onClose={handleClose}
        open={open}
      >
        <motion.ul layout>
          <motion.li layout>
            <div className={classes.left}>
              <MovingAverage index={index} />
            </div>
            {globalButtonEnabled && <GlobalizeButton onClick={() => handleClick("movingAverage")} />}
          </motion.li>
          <motion.li layout>
            <div className={classes.left}>
              <ExponentialMovingAverage index={index} />
            </div>
            {globalButtonEnabled && <GlobalizeButton onClick={() => handleClick("exponentialMovingAverage")} />}
          </motion.li>
          <motion.li layout>
            <div className={classes.left}>
              <CommodityChannelIndex index={index} />
            </div>
            {globalButtonEnabled && <GlobalizeButton onClick={() => handleClick("commodityChannelIndex")} />}
          </motion.li>
          <motion.li layout>
            <div className={classes.left}>
              <Supertrend index={index} />
            </div>
            {globalButtonEnabled && <GlobalizeButton onClick={() => handleClick("supertrend")} />}
          </motion.li>
          <motion.li layout>
            <div className={classes.left}>
              <OnBalanceVolume index={index} />
            </div>
            {globalButtonEnabled && <GlobalizeButton onClick={() => handleClick("onBalanceVolume")} />}
          </motion.li>
        </motion.ul>
      </Modal>
    </>
  );
};

export default IndicatorsModal;
