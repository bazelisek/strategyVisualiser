import React, { type ReactNode } from "react";
import { User as BAUser } from "better-auth";
import { Avatar, AvatarProps } from "@mui/joy";
import { motion } from "framer-motion";

interface UserAvatarProps extends Omit<AvatarProps, "children"> {
  user: BAUser;
  hover?: boolean;
  motionDivProps?: React.ComponentProps<typeof motion.div>;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  hover = false,
  onClick,
  ref,
  motionDivProps,
  ...props
}) => {
  const children: ReactNode = (
    <Avatar alt={user.name} src={user.image ?? undefined} {...props}>
      {user.name[0].toUpperCase()}
    </Avatar>
  );

  if (hover) {
    return (
      <motion.div
        animate={{ scale: 1, boxShadow: "none" }}
        whileHover={{ scale: 1.05, boxShadow: "0 0 6px var(--accent)" }}
        style={{
          display: "inline-flex",
          borderRadius: "50%",
          cursor: "pointer",
        }}
        onClick={onClick}
        ref={ref}
        {...motionDivProps}
      >
        {children}
      </motion.div>
    );
  }
  return children;
};

export default UserAvatar;
