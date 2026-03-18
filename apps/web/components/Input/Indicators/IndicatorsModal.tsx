import React, { ReactNode } from "react";
import classes from "./IndicatorsModal.module.css";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { makeGlobal, RootState, setModal } from "@/store/reduxStore";
import Modal from "@/components/Modal";
import GlobalizeButton from "../Buttons/GlobalizeButton";
import NewIndicatorButton from "./NewIndicatorButton";
import useIndicators from "@/hooks/useIndicators";
import { useTiles } from "@/hooks/useTiles";
import IndicatorRow from "./IndicatorRow";

interface IndicatorsModalProps {
  children?: ReactNode;
  index: number;
  globalButtonEnabled?: boolean;
}

const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  index,
  globalButtonEnabled,
}) => {
  const { tiles } = useTiles();
  const numberOfTiles = tiles.length;
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
          {indicatorsState
            .map((indicator, indicatorIndex) => ({ indicator, indicatorIndex }))
            .filter(({ indicator }) => indicator.index === index)
            .map(({ indicatorIndex }) => (
              <motion.li key={indicatorIndex}>
                <div className={classes.left}>
                  <IndicatorRow indicatorIndex={indicatorIndex} />
                </div>
                {globalButtonEnabled && (
                  <GlobalizeButton onClick={() => handleClick(indicatorIndex)} />
                )}
              </motion.li>
            ))}
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
};

export default IndicatorsModal;
