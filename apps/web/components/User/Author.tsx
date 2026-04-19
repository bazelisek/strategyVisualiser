import { Avatar, Typography } from "@mui/joy";
import { User } from "better-auth";
import React from "react";

interface UserByEmailProps {
  user?: User | null;
  displayUsername?: boolean;
}

const UserByEmail: React.FC<UserByEmailProps> = ({ user, displayUsername }) => {
  const fallbackLabel = "Unknown user";
  const displayName = user?.name ?? user?.email ?? fallbackLabel;
  const avatarLabel = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Avatar src={user?.image ?? undefined}>
        {avatarLabel}
      </Avatar>
      {displayUsername && <Typography>{displayName}</Typography>}
    </div>
  );
};

export default UserByEmail;
