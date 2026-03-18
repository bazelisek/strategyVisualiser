// components/User/UserPopoverContent.tsx
import React from "react";
import { User as BAUser } from "better-auth";
import { Stack, Typography } from "@mui/joy";
import UserAvatar from "./UserAvatar";
import UploadImage from "../Input/File/UploadImage";
import { authClient } from "@/auth-client";
import { useGetAuthStatus } from "@/auth/useGetAuthStatus";
import classes from "./UserPopoverContent.module.css";
import UploadIcon from "../Input/File/UploadIcon";

interface UserPopoverContentProps {
  user: BAUser;
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const UserPopoverContent: React.FC<UserPopoverContentProps> = ({ user }) => {
  const { refetch } = useGetAuthStatus();
  console.log(user);

  async function handleAvatarFile(file: File) {
    const dataUrl = await fileToDataUrl(file);
    await authClient.updateUser({ image: dataUrl });
    await refetch();
  }

  return (
    <div style={{ padding: 20 }}>
      <Stack
        direction="column"
        justifyContent="center"
        alignItems="center"
        gap={1}
      >
        <div className={classes["upload-wrapper"]}>
          <UploadImage
            className={classes["file-input"]}
            onFileSelected={handleAvatarFile}
          />
          <UploadIcon className={classes["file-icon"]} />
          <UserAvatar sx={{ width: 96, height: 96 }} user={user} hover />
        </div>
        <Typography level="h4">{user.name}</Typography>
      </Stack>
    </div>
  );
};

export default UserPopoverContent;
