import React, { ReactNode, useState } from "react";
import ShowModalButton from "./Indicators/ShowModalButton";
import classes from "./Preconfiguration.module.css";
import PreconfigureForm from "./PreconfigureForm";
import AnimationButton from "./Buttons/AnimationButton";
import { useDispatch } from "react-redux";
import { setConfigs } from "@/store/reduxStore";

interface PreconfigurationProps {
  children?: ReactNode;
}

const Preconfiguration: React.FC<PreconfigurationProps> = (props) => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  function handleClose(formData: {
    symbol: { defaultValue: string };
    interval: { defaultValue: string };
    period1: { defaultValue: string };
    period2: { defaultValue: string };
    strategy: { defaultValue: string };
  }) {
    console.log(JSON.stringify(formData))
    setOpen(false);
    dispatch(setConfigs(formData));
  }
  function handleClick() {
    setOpen(true);
  }
  return (
    <div className={classes.div}>
      <h3>Defaults</h3>
      <div className={classes.flex}>
        <ShowModalButton index={0} globalButtonEnabled={true}>
          Ahoj
        </ShowModalButton>
        <AnimationButton
          onClick={handleClick}
          disabled={open}
          className={classes.button}
        >
          Tile
        </AnimationButton>
        <PreconfigureForm onClose={handleClose} open={open} />
      </div>
    </div>
  );
};

export default Preconfiguration;
