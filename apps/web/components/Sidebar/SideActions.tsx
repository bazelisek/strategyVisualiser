import React, { ReactNode } from "react";
import ClearAllButton from "./ClearAllButton";
import classes from "./SideActions.module.css";

interface SideActionsProps {
  children?: ReactNode;
}

const SideActions: React.FC<SideActionsProps> = (props) => {
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
