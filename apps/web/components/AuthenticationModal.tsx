"use client";
import React, { useEffect, useState } from "react";
import Tabs from "@mui/joy/Tabs";
import TabList from "@mui/joy/TabList";
import Tab from "@mui/joy/Tab";
import Modal from "@/components/Modal";
import classes from "./AuthenticationModal.module.css";
import { login } from "@/auth/login";
import { signup } from "@/auth/signup";
import { CircularProgress } from "@mui/joy";
import AuthPanelTransition from "@/components/AuthPanelTransition";

interface AuthenticationModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

const AuthenticationModal: React.FC<AuthenticationModalProps> = ({
  open,
  onClose,
  onAuthenticated,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [signupLoading, setSignupLoading] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupName, setSignupName] = useState("");

  useEffect(() => {
    if (!open) {
      setActiveTab(0);
      setLoginEmail("");
      setLoginPassword("");
      setLoginError(null);
      setSignupEmail("");
      setSignupPassword("");
      setSignupConfirmPassword("");
      setSignupError(null);
      setSignupName("");
    }
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);

    try {
      const result = await login(loginEmail, loginPassword);
      if (result.success) {
        onAuthenticated();
        onClose();
      } else {
        setLoginError(result.error ?? "Login failed");
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed");
    }
  };

  const handleSignupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSignupError(null);

    if (signupPassword !== signupConfirmPassword) {
      setSignupError("Passwords do not match");
      return;
    }

    try {
      setSignupLoading(true);
      const result = await signup(signupEmail, signupPassword, signupName);
      if (result.success) {
        onAuthenticated();
        onClose();
      } else {
        setSignupError(result.error ?? "Sign up failed");
      }
    } catch (error) {
      setSignupError(error instanceof Error ? error.message : "Sign up failed");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Login / Sign up"
      className={classes.modal}
    >
      <div className={classes.authModal}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value as number)}
        >
          <TabList className={classes.tabList}>
            <Tab className={classes.tab} value={0}>
              Login
            </Tab>
            <Tab className={classes.tab} value={1}>
              Sign up
            </Tab>
          </TabList>
          <AuthPanelTransition activeTab={activeTab}>
            {activeTab === 0 ? (
              <div className={classes.tabPanel}>
                <h3 className={classes.heading}>Login</h3>
                <form className={classes.form} onSubmit={handleLoginSubmit}>
                  <div className={classes.field}>
                    <label htmlFor="login-email">Email</label>
                    <input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      required
                    />
                  </div>
                  <div className={classes.field}>
                    <label htmlFor="login-password">Password</label>
                    <input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      required
                    />
                  </div>
                  {loginError && <p className={classes.error}>{loginError}</p>}
                  <button type="submit" className={classes.primaryButton}>
                    Continue to login
                  </button>
                </form>
              </div>
            ) : (
              <div className={classes.tabPanel}>
                <h3 className={classes.heading}>Sign up</h3>
                <form className={classes.form} onSubmit={handleSignupSubmit}>
                  <div className={classes.field}>
                    <label htmlFor="signup-email">Email</label>
                    <input
                      id="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(event) => setSignupEmail(event.target.value)}
                      required
                    />
                  </div>
                  <div className={classes.field}>
                    <label htmlFor="signup-name">Email</label>
                    <input
                      id="signup-name"
                      type="name"
                      value={signupName}
                      onChange={(event) => setSignupName(event.target.value)}
                      required
                    />
                  </div>
                  <div className={classes.field}>
                    <label htmlFor="signup-password">Password</label>
                    <input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(event) => setSignupPassword(event.target.value)}
                      required
                    />
                  </div>
                  <div className={classes.field}>
                    <label htmlFor="signup-confirm-password">
                      Confirm password
                    </label>
                    <input
                      id="signup-confirm-password"
                      type="password"
                      value={signupConfirmPassword}
                      onChange={(event) =>
                        setSignupConfirmPassword(event.target.value)
                      }
                      required
                    />
                  </div>
                  {signupError && <p className={classes.error}>{signupError}</p>}
                  <button type="submit" className={classes.primaryButton}>
                    {signupLoading ? <CircularProgress /> : "Continue to sign up"}
                  </button>
                </form>
              </div>
            )}
          </AuthPanelTransition>
        </Tabs>
      </div>
    </Modal>
  );
};

export default AuthenticationModal;
