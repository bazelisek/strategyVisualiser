"use client";
import React, { ReactNode } from "react";
import classes from "./QuickActionsModal.module.css";
import Modal from "@/components/Modal";

interface QuickActionsModalProps {
  children?: ReactNode;
  heading: string;
  open: boolean;
  onClose: () => void;
}

const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  children,
  open,
  heading,
  onClose,
}) => {
  return (
    <>
      <Modal
        title={heading}
        onClose={onClose}
        open={open}
        dialogSx={{ width: "min(560px, 92vw)", maxHeight: "80vh" }}
        contentSx={{ overflow: "hidden" }}
        contentClassName={classes.content}
      >
        {children}
      </Modal>
    </>
  );
};

export default QuickActionsModal;
