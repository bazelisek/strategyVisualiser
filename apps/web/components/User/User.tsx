import { Avatar, Modal } from "@mui/joy";
import { Popover } from "@mui/material";
import { User as BAUser } from "better-auth";
import { motion } from "framer-motion";
import React, { useRef, useState, type ReactNode } from "react";
import UserPopoverContent from "./UserPopoverContent";
import UserAvatar from "./UserAvatar";

interface UserProps {
  user: BAUser;
}

const User: React.FC<UserProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const anchorEl = useRef(null);
  return (
    <>
      <Popover
        id="avatar-popover"
        open={isOpen}
        anchorEl={anchorEl.current}
        onClose={() => setIsOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        sx={{ marginRight: 2, marginTop: 1 }}
        slotProps={{ paper: { sx: { borderRadius: 20 }, elevation: 8 } }}
      >
        <UserPopoverContent user={user} />
      </Popover>
      <UserAvatar
        user={user}
        onClick={() => setIsOpen((prev) => !prev)}
        ref={anchorEl}
        hover
      />
    </>
  );
};

export default User;
