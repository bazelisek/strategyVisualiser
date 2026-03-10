'use client';
import React, { ReactNode } from 'react';
import classes from './Header.module.css';
import Link from 'next/link';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import { useLogout } from '@/auth/logout';
import { useGetAuthStatus } from '@/auth/useGetAuthStatus';

interface HeaderProps {
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = () => {
  const logout = useLogout();
  const { isAuthenticated, isPending } = useGetAuthStatus();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Logout errors can be handled here if needed.
    }
  };

  return (
    <>
      <header className={classes.header}>
        <Link href={'/'}>
          <Typography level="h2" sx={{ m: 0, lineHeight: 1.15 }}>
            React Strategy Visualiser
          </Typography>
        </Link>
        <div className={classes.actions}>
          {!isPending && !isAuthenticated && (
            <Button variant="outlined" size="sm" component={Link} href="/login">
              Login / Sign up
            </Button>
          )}
          {!isPending && isAuthenticated && (
            <Button variant="solid" size="sm" color="danger" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
