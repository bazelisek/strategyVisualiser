'use client';
import React, { ReactNode, useEffect, useState } from 'react';
import classes from './Header.module.css';
import Link from 'next/link';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import Tabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab from '@mui/joy/Tab';
import TabPanel from '@mui/joy/TabPanel';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import FormHelperText from '@mui/joy/FormHelperText';
import { login } from '@/auth/login';
import { signup } from '@/auth/signup';
import { logout } from '@/auth/logout';
import { getAuthStatus } from '@/auth/getAuthStatus';

interface HeaderProps {
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getAuthStatus();
        setIsLoggedIn(status);
      } catch {
        setIsLoggedIn(false);
      }
    };

    fetchStatus();
  }, []);

  const handleOpenLogin = () => {
    setIsLoginOpen(true);
  };

  const handleCloseLogin = () => {
    setIsLoginOpen(false);
    setLoginError(null);
    setSignupError(null);
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);

    try {
      const result = await login(loginEmail, loginPassword);
      if (result.success) {
        setIsLoggedIn(true);
        setIsLoginOpen(false);
        setLoginError(null);
        setSignupError(null);
      } else {
        setLoginError(result.error ?? 'Login failed');
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const handleSignupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSignupError(null);

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }

    try {
      const result = await signup(signupEmail, signupPassword);
      if (result.success) {
        setIsLoggedIn(true);
        setIsLoginOpen(false);
        setLoginError(null);
        setSignupError(null);
      } else {
        setSignupError(result.error ?? 'Sign up failed');
      }
    } catch (error) {
      setSignupError(error instanceof Error ? error.message : 'Sign up failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsLoggedIn(false);
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
          {isLoggedIn === false && (
            <Button variant="outlined" size="sm" onClick={handleOpenLogin}>
              Login / Sign up
            </Button>
          )}
          {isLoggedIn === true && (
            <Button variant="solid" size="sm" color="danger" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </div>
      </header>
      <Modal open={isLoginOpen} onClose={handleCloseLogin}>
        <ModalDialog>
          <Tabs defaultValue={0}>
            <TabList>
              <Tab value={0}>Login</Tab>
              <Tab value={1}>Sign up</Tab>
            </TabList>
            <TabPanel value={0}>
              <Typography level="h4" sx={{ mb: 2 }}>
                Login
              </Typography>
              <form onSubmit={handleLoginSubmit}>
                <FormControl sx={{ mb: 2 }}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    required
                  />
                </FormControl>
                <FormControl sx={{ mb: 2 }}>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    required
                  />
                </FormControl>
                {loginError && (
                  <FormHelperText color="danger" sx={{ mb: 1 }}>
                    {loginError}
                  </FormHelperText>
                )}
                <Button type="submit" fullWidth variant="solid">
                  Continue to login
                </Button>
              </form>
            </TabPanel>
            <TabPanel value={1}>
              <Typography level="h4" sx={{ mb: 2 }}>
                Sign up
              </Typography>
              <form onSubmit={handleSignupSubmit}>
                <FormControl sx={{ mb: 2 }}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={signupEmail}
                    onChange={(event) => setSignupEmail(event.target.value)}
                    required
                  />
                </FormControl>
                <FormControl sx={{ mb: 2 }}>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    value={signupPassword}
                    onChange={(event) => setSignupPassword(event.target.value)}
                    required
                  />
                </FormControl>
                <FormControl sx={{ mb: 2 }}>
                  <FormLabel>Confirm password</FormLabel>
                  <Input
                    type="password"
                    value={signupConfirmPassword}
                    onChange={(event) => setSignupConfirmPassword(event.target.value)}
                    required
                  />
                </FormControl>
                {signupError && (
                  <FormHelperText color="danger" sx={{ mb: 1 }}>
                    {signupError}
                  </FormHelperText>
                )}
                <Button type="submit" fullWidth variant="solid">
                  Continue to sign up
                </Button>
              </form>
            </TabPanel>
          </Tabs>
        </ModalDialog>
      </Modal>
    </>
  );
};

export default Header;