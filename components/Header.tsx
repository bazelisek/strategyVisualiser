import React, { ReactNode } from 'react';
import classes from './Header.module.css';

interface HeaderProps {
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = (props) => {
  return (
    <header className={classes.header}>
        <h1>
            React Strategy Visuliser
        </h1>
    </header>
  );
};

export default Header;