"use client";

import { useEffect, useState } from "react";
import Tabs from "@mui/joy/Tabs";
import TabList from "@mui/joy/TabList";
import Tab from "@mui/joy/Tab";
import TabPanel from "@mui/joy/TabPanel";
import { CircularProgress } from "@mui/joy";
import { useRouter } from "next/navigation";
import { authClient } from "@/auth-client";
import { useGetAuthStatus } from "@/auth/useGetAuthStatus";
import pageClasses from "./page.module.css";
import authClasses from "@/components/AuthenticationModal.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isPending } = useGetAuthStatus();

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
    if (isPending) {
      return;
    }

    if (isAuthenticated) {
      router.replace("/visualize");
    }
  }, [isAuthenticated, isPending, router]);

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);

    try {
      const { error } = await authClient.signIn.email({
        email: loginEmail,
        password: loginPassword,
      });
      if (!error) {
        router.replace("/visualize");
      } else {
        setLoginError(error.message ?? "Login failed");
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
      const { error } = await authClient.signUp.email({
        email: signupEmail,
        password: signupPassword,
        name: signupName,
      });
      if (!error) {
        router.replace("/visualize");
      } else {
        setSignupError(error.message ?? "Sign up failed");
      }
    } catch (error) {
      setSignupError(error instanceof Error ? error.message : "Sign up failed");
    } finally {
      setSignupLoading(false);
    }
  };

  if (isPending || isAuthenticated) {
    return (
      <div className="loading">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className={pageClasses.page}>
      <div className={pageClasses.card}>
        <h1 className={pageClasses.title}>Welcome back</h1>
        <p className={pageClasses.subtitle}>
          Log in to your strategy workspace or create an account.
        </p>
        <div className={authClasses.authModal}>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value as number)}>
            <TabList className={authClasses.tabList}>
              <Tab className={authClasses.tab} value={0}>
                Login
              </Tab>
              <Tab className={authClasses.tab} value={1}>
                Sign up
              </Tab>
            </TabList>
            <TabPanel className={authClasses.tabPanel} value={0}>
              <h3 className={authClasses.heading}>Login</h3>
              <form className={authClasses.form} onSubmit={handleLoginSubmit}>
                <div className={authClasses.field}>
                  <label htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    required
                  />
                </div>
                <div className={authClasses.field}>
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    required
                  />
                </div>
                {loginError && <p className={authClasses.error}>{loginError}</p>}
                <button type="submit" className={authClasses.primaryButton}>
                  Continue to login
                </button>
              </form>
            </TabPanel>
            <TabPanel className={authClasses.tabPanel} value={1}>
              <h3 className={authClasses.heading}>Sign up</h3>
              <form className={authClasses.form} onSubmit={handleSignupSubmit}>
                <div className={authClasses.field}>
                  <label htmlFor="signup-email">Email</label>
                  <input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(event) => setSignupEmail(event.target.value)}
                    required
                  />
                </div>
                <div className={authClasses.field}>
                  <label htmlFor="signup-name">Name</label>
                  <input
                    id="signup-name"
                    type="text"
                    value={signupName}
                    onChange={(event) => setSignupName(event.target.value)}
                    required
                  />
                </div>
                <div className={authClasses.field}>
                  <label htmlFor="signup-password">Password</label>
                  <input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(event) => setSignupPassword(event.target.value)}
                    required
                  />
                </div>
                <div className={authClasses.field}>
                  <label htmlFor="signup-confirm-password">Confirm password</label>
                  <input
                    id="signup-confirm-password"
                    type="password"
                    value={signupConfirmPassword}
                    onChange={(event) => setSignupConfirmPassword(event.target.value)}
                    required
                  />
                </div>
                {signupError && <p className={authClasses.error}>{signupError}</p>}
                <button type="submit" className={authClasses.primaryButton}>
                  {signupLoading ? <CircularProgress /> : "Continue to sign up"}
                </button>
              </form>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
