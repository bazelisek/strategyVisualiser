"use client";
import { IconButton, Tooltip } from "@mui/joy";
import { redirect, useRouter } from "next/navigation";
import React, { type ReactNode } from "react";
import AddIcon from "@mui/icons-material/Add";

interface AddStrategyButtonProps {
  children?: ReactNode;
}

const AddStrategyButton: React.FC<AddStrategyButtonProps> = (props) => {
  const router = useRouter();
  function handleAddStrategy() {
    router.push("strategies/new");
  }
  return (
    <Tooltip title="Add Strategy">
      <IconButton
        sx={{ position: "absolute", top: 20, right: 20 }}
        variant="outlined"
        onClick={handleAddStrategy}
      >
        <AddIcon />
      </IconButton>
    </Tooltip>
  );
};

export default AddStrategyButton;
