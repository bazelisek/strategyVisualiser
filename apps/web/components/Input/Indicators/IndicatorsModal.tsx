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
import NewIndicatorButton from "./NewIndicatorButton";
import { useSearchParams } from "next/navigation";
import useIndicators from "@/hooks/useIndicators";
import { readTilesFromSearchParams } from "@/util/tilesSearchParams";

interface IndicatorsModalProps {
  children?: ReactNode;
  index: number;
  globalButtonEnabled?: boolean;
}

const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  index,
  globalButtonEnabled,
}) => {
  const params = useSearchParams();
  const numberOfTiles = readTilesFromSearchParams(params).length;
  const modalSlice = useSelector((state: RootState) => state.modals);
  const indicatorsState = useIndicators();
  const open = modalSlice[index]?.indicators || false;
  const dispatch = useDispatch();

  function handleClose() {
    dispatch(setModal({ modal: { index, modal: "indicators" }, value: false }));
  }

  function handleClick(indicatorIndex: number) {
    console.log("Making global");
    console.log(indicatorIndex);
    dispatch(makeGlobal({ indicatorIndex, numberOfTiles }));
  }

  return (
    <>
      <Modal
        title="Indicators"
        className={classes.modal}
        onClose={handleClose}
        open={open}
      >
        <NewIndicatorButton index={index}></NewIndicatorButton>
        <motion.ul layout>
          {indicatorsState.map((indicator, indexOfIndicator) => {
            if (indicator.index != index) return;
            return (
              <motion.li key={indexOfIndicator}>
                <div className={classes.left}>
                  {designateJSXToIndicator(indicator.key, indexOfIndicator)}
                </div>
                {globalButtonEnabled && (
                  <GlobalizeButton onClick={() => handleClick(indexOfIndicator)} />
                )}
              </motion.li>
            );
          })}
          {/*
          <motion.li layout>
            <div className={classes.left}>
              <MovingAverage index={index} />
            </div>
            {globalButtonEnabled && (
              <GlobalizeButton onClick={() => handleClick("movingAverage")} />
            )}
          </motion.li>
          <motion.li layout>
            <div className={classes.left}>
              <ExponentialMovingAverage index={index} />
            </div>
            {globalButtonEnabled && (
              <GlobalizeButton
                onClick={() => handleClick("exponentialMovingAverage")}
              />
            )}
          </motion.li>
          <motion.li layout>
            <div className={classes.left}>
              <CommodityChannelIndex index={index} />
            </div>
            {globalButtonEnabled && (
              <GlobalizeButton
                onClick={() => handleClick("commodityChannelIndex")}
              />
            )}
          </motion.li>
          <motion.li layout>
            <div className={classes.left}>
              <Supertrend index={index} />
            </div>
            {globalButtonEnabled && (
              <GlobalizeButton onClick={() => handleClick("supertrend")} />
            )}
          </motion.li>
          <motion.li layout>
            <div className={classes.left}>
              <OnBalanceVolume index={index} />
            </div>
            {globalButtonEnabled && (
              <GlobalizeButton onClick={() => handleClick("onBalanceVolume")} />
            )}
          </motion.li>*/}
        </motion.ul>
      </Modal>
    </>
  );
  function designateJSXToIndicator(indicatorKey: string, index: number) {
    if (indicatorKey == "movingAverage") {
      return <MovingAverage  indicatorIndex={index} />;
    }
    if (indicatorKey == "exponentialMovingAverage") {
      return <ExponentialMovingAverage  indicatorIndex={index} />;
    }
    if (indicatorKey == "commodityChannelIndex") {
      return <CommodityChannelIndex  indicatorIndex={index} />;
    }
    if (indicatorKey == "supertrend") {
      return <Supertrend  indicatorIndex={index} />;
    }
    if (indicatorKey == "onBalanceVolume") {
      return <OnBalanceVolume  indicatorIndex={index} />;
    }
    console.log(indicatorKey);
    throw new Error("Wrong indicatorKey");
  }
};

export default IndicatorsModal;
