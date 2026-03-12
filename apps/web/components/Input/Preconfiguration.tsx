import React, { ReactNode, useState } from "react";
import ShowModalButton from "./Indicators/ShowModalButton";
import classes from "./Preconfiguration.module.css";
import PreconfigureForm from "./PreconfigureForm";
import AnimationButton from "./Buttons/AnimationButton";
import { useDispatch } from "react-redux";
import { setConfigs } from "@/store/reduxStore";
import type { ConfigState } from "@/store/slices/configSlice";
import { useTiles } from "@/hooks/useTiles";

interface PreconfigurationProps {
  children?: ReactNode;
}

const Preconfiguration: React.FC<PreconfigurationProps> = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const { visualizationId } = useTiles();

  const persistDefaults = async (defaults: ConfigState) => {
    if (!visualizationId) return;
    try {
      const res = await fetch("/api/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: visualizationId,
          params: { defaults },
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update defaults");
      }
    } catch (error) {
      console.error("Failed to persist defaults", error);
    }
  };

  function handleClose(formData: ConfigState) {
    console.log(JSON.stringify(formData));
    setOpen(false);
    dispatch(setConfigs(formData));
    void persistDefaults(formData);
  }
  function handleClick() {
    setOpen(true);
  }
  return (
    <div className={classes.div}>
      <h3>Defaults</h3>
      <div className={classes.flex}>
        <ShowModalButton index={0} globalButtonEnabled={true} />
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
