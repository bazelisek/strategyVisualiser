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
import { link } from "node:fs/promises";
import User from "./User/User";

interface HeaderProps {
  children?: ReactNode;
}

const pageLinks: { path: string; name: string }[] = [
  {
    path: "/history",
    name: "Visualizations",
  },
  {
    path: "/strategies",
    name: 'Strategies'
  }
];

const Header: React.FC<HeaderProps> = () => {
  const logout = useLogout();
  const { isAuthenticated, isPending, session } = useGetAuthStatus();
  const currentPath = usePathname();

  const newPageLinks = pageLinks.filter(({ path }) => path !== currentPath);

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
        <Link className={classes.brand} href={"/"}>
          <Typography level="h2" sx={{ m: 0, lineHeight: 1.15 }}>
            React Strategy Visualiser
          </Typography>
        </Link>
        <Stack
          className={classes.nav}
          direction={"row"}
          sx={{ marginX: 5 }}
          gap={2}
        >
          {newPageLinks.map(({ path, name }) => (
            <JoyUILink component={Link} key={path} href={path}>
              <Typography textAlign={"center"}>{name}</Typography>
            </JoyUILink>
          ))}
        </Stack>
        <div className={classes.actions}>
          {!isPending && !isAuthenticated && (
            <Button variant="outlined" size="sm" component={Link} href="/login">
              Login / Sign up
            </Button>
          )}
          {!isPending && isAuthenticated && session?.user && (
            <Stack direction={'row'} gap={1}>
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
