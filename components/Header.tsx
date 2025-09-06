import React, { ReactNode } from 'react';
import classes from './Header.module.css';
import Link from 'next/link';

interface HeaderProps {
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = (props) => {
  return (
    <header className={classes.header}>
      <Link href={'/'}>
        <h1>
            React Strategy Visuliser
        </h1>
        </Link>
    </header>
  );
};

export default Header;