import React from 'react';
import classes from './Sidebar.module.css';
import SideActions from './SideActions';

const Sidebar: React.FC = () => {
  return (
    <div className={classes.sidebar + " side-div"}>
      <SideActions />
    </div>
  );
};

export default Sidebar;
