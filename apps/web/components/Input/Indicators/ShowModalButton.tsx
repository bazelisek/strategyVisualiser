import React from "react";
import IndicatorsModal from "./IndicatorsModal";
import classes from "./ShowModalButton.module.css";
import AnimationButton from "../Buttons/AnimationButton";
import { useModalController } from "@/components/ModalController";

interface ShowModalButtonProps {
  index: number;
  className?: string;
  globalButtonEnabled?: boolean;
}

const ShowModalButton: React.FC<ShowModalButtonProps> = ({
  index,
  className,
  globalButtonEnabled = false,
}) => {
  const { isOpen, toggle } = useModalController();
  const open = isOpen("indicators", index);
  function handleClick() {
    toggle("indicators", index);
  }
  return (
    <>
      <AnimationButton
        className={`${classes.button} ${className}`}
        onClick={handleClick}
      >
        Indicators
      </AnimationButton>
      <IndicatorsModal
        index={index}
        globalButtonEnabled={globalButtonEnabled}
        open={open}
      />
    </>
  );
};

export default ShowModalButton;
