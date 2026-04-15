import { useSession } from "@/auth-client";
import { Avatar, Typography } from "@mui/joy";
import { User } from "better-auth";
import React, { type ReactNode } from "react";

interface UserByEmailProps {
  user: User;
  displayUsername?: boolean;
}

const UserByEmail: React.FC<UserByEmailProps> = ({ user, displayUsername }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Avatar src={user?.image ?? undefined}>
        {user?.name[0]?.toUpperCase() ?? user.email}
      </Avatar>
      {displayUsername && <Typography>{user.name ?? user.email}</Typography>}
    </div>
  );
};

export default UserByEmail;
