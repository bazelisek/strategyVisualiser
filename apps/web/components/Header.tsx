'use client';
import React, { ReactNode } from 'react';
import classes from './Header.module.css';
import Link from 'next/link';
import Typography from '@mui/joy/Typography';

interface HeaderProps {
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = () => {
  return (
    <header className={classes.header}>
      <Link href={'/'}>
        <Typography sx={{m: 3}}  level='h1'>
            React Strategy Visualiser
        </Typography>
        </Link>
    </header>
  );
};

export default Header;