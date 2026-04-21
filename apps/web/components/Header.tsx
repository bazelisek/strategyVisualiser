"use client";
import React, { ReactNode } from "react";
import classes from "./Header.module.css";
import Link from "next/link";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import { useLogout } from "@/auth/logout";
import { useGetAuthStatus } from "@/auth/useGetAuthStatus";
import { usePathname } from "next/navigation";
import { Stack, Link as JoyUILink } from "@mui/joy";
import User from "./User/User";
import AppIcon from "./common/AppIcon";

interface HeaderProps {
  children?: ReactNode;
}

const appLinks: { path: string; name: string }[] = [
  {
    path: "/history",
    name: "Visualizations",
  },
  {
    path: "/strategies",
    name: 'Strategies'
  }
];

const landingLinks: { path: string; name: string }[] = [
  {
    path: "/#how-it-works",
    name: "How it works",
  },
  {
    path: "/#features",
    name: "Features",
  },
  {
    path: "/#preview",
    name: "Preview",
  },
  {
    path: "/#credibility",
    name: "Technical",
  },
];

const Header: React.FC<HeaderProps> = () => {
  const logout = useLogout();
  const { isAuthenticated, isPending, session } = useGetAuthStatus();
  const currentPath = usePathname();
  const isLandingPage = currentPath === "/";
  const pageLinks = isLandingPage ? landingLinks : appLinks;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Logout errors can be handled here if needed.
    }
  };

  return (
    <>
      <header className={`${classes.header} ${isLandingPage ? classes.landingHeader : ""}`}>
        <Link className={classes.brand} href={"/"} style={{display: 'flex', alignItems: 'center'}}>
          <Typography level="h2" sx={{ m: 0, lineHeight: 1.15 }}>
            Strategize
          </Typography>
          <AppIcon />
        </Link>
        <Stack
          className={classes.nav}
          direction={"row"}
          sx={{ marginX: 5 }}
          gap={2}
        >
          {pageLinks.map(({ path, name }) => (
            <JoyUILink
              component={Link}
              key={path}
              href={path}
              underline={!isLandingPage && path === currentPath ? 'always' : 'hover'}
            >
              <Typography textAlign={"center"}>{name}</Typography>
            </JoyUILink>
          ))}
        </Stack>
        <div className={classes.actions}>
          {!isPending && !isAuthenticated && isLandingPage && (
            <>
              <Button variant="plain" size="sm" component={Link} href="/#features">
                Product overview
              </Button>
              <Button variant="solid" size="sm" component={Link} href="/login">
                Sign in
              </Button>
            </>
          )}
          {!isPending && !isAuthenticated && !isLandingPage && (
            <Button variant="outlined" size="sm" component={Link} href="/login">
              Login / Sign up
            </Button>
          )}
          {!isPending && isAuthenticated && session?.user && (
            <Stack direction={'row'} gap={1}>
              {isLandingPage && (
                <Button variant="plain" size="sm" component={Link} href="/history">
                  Open workspace
                </Button>
              )}
              <User user={session.user} />
              <Button
                variant="solid"
                size="sm"
                color="danger"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Stack>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
