import React, { ReactNode } from 'react';
import classes from './Sidebar.module.css';
import SideActions from './SideActions';

interface SidebarProps {
  children?: ReactNode;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    <div className={classes.sidebar + " side-div"}>
      <SideActions />
    </div>
  );
};

export default Sidebar;