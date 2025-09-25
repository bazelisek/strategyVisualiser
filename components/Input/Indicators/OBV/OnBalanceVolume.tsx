import React, { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, setIndicatorsVisibility } from "@/store/reduxStore";
import Switch from "../../Buttons/Switch";
//import classes from "./OnBalanceVolume.module.css";
//import OnBalanceVolumeDropdown from "./OnBalanceVolumeDropdown";
//import DropdownButton from "../Buttons/DropdownButton";

interface OnBalanceVolumeProps {
  children?: ReactNode;
  index: number;
}

const OnBalanceVolume: React.FC<OnBalanceVolumeProps> = ({index}) => {
  const indicators = useSelector((state: RootState) => state.indicators);
  const dispatch = useDispatch();
  //const [open, setOpen] = useState(false);
  function handleOBVToggle(value: boolean) {
    dispatch(
      setIndicatorsVisibility({ index, indicator: "onBalanceVolume", value: value })
    );
  }
  /*
  function toggleDropdown() {
    setOpen((old) => !old);
  }
  */
  return (
    <>
      <div className="indicator-selector-div">
        <p>On Balance Volume</p>
        <div>
          {/*<DropdownButton onClick={toggleDropdown} />*/}
          <Switch
            isChecked={indicators[index]?.onBalanceVolume.visible || false}
            clickHandler={handleOBVToggle}
          />
        </div>
      </div>
      {/*<OnBalanceVolumeDropdown open={open} />*/}
    </>
  );
};

export default OnBalanceVolume;
