import { IconButton, IconButtonProps } from "@mui/joy";
import SettingsIcon from "@mui/icons-material/Settings";
import { MouseEvent } from "react";

interface Config extends Omit<IconButtonProps, "children"> {}

export default function Config({ onClick, ...props }: IconButtonProps) {
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    // Navigate back to tile config
    onClick?.(e);
  }

  return (
    <IconButton onClick={handleClick} {...props}>
      <SettingsIcon />
    </IconButton>
  );
}
