import React, { type ReactNode } from "react";
import { User as BAUser } from "better-auth";
import { Sheet, Stack, Typography } from "@mui/joy";
import { Avatar } from "@mui/material";
import UserAvatar from "./UserAvatar";

interface UserPopoverContentProps {
  user: BAUser;
}

const UserPopoverContent: React.FC<UserPopoverContentProps> = ({ user }) => {
  function handleAvatarClick() {
    console.log("Not implemented.");
  }
  return (
    <div style={{ padding: 20 }}>
      <Stack
        direction={"column"}
        justifyContent={"center"}
        alignItems={"center"}
        gap={1}
      >
        <UserAvatar
          sx={{ width: 96, height: 96 }}
          user={user}
          hover
          onClick={handleAvatarClick}
        />
        <Typography level="h4">{user.name}</Typography>
      </Stack>
    </div>
  );
};

export default UserPopoverContent;
