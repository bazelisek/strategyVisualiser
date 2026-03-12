import React from "react";
import ClearAllButton from "./ClearAllButton";
import classes from "./SideActions.module.css";

const SideActions: React.FC = () => {
  return (
    <div>
      <ul className={classes.ul}>
        <li>
          <ClearAllButton />
        </li>
      </ul>
    </div>
  );
};

export default SideActions;
