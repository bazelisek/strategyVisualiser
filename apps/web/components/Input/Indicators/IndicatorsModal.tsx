import React from "react";
import classes from "./IndicatorsModal.module.css";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { makeGlobal } from "@/store/reduxStore";
import Modal from "@/components/Modal";
import GlobalizeButton from "../Buttons/GlobalizeButton";
import NewIndicatorButton from "./NewIndicatorButton";
import useIndicators from "@/hooks/useIndicators";
import { useTiles } from "@/hooks/useTiles";
import IndicatorRow from "./IndicatorRow";
import { useModalController } from "@/components/ModalController";

interface IndicatorsModalProps {
  index: number;
  globalButtonEnabled?: boolean;
  open: boolean;
}

const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  index,
  globalButtonEnabled,
  open,
}) => {
  const { tiles } = useTiles();
  const numberOfTiles = tiles.length;
  const indicatorsState = useIndicators();
  const dispatch = useDispatch();
  const { close } = useModalController();

  function handleClose() {
    close();
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
        onClose={handleClose}
        open={open}
        dialogSx={{ width: "min(760px, 92vw)" }}
        contentClassName={classes.content}
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
