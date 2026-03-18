"use client";
import React, { ReactNode } from "react";
import classes from "./QuickActionsModal.module.css";
import { useDispatch } from "react-redux";
import { setModal } from "@/store/reduxStore";
import Modal from "@/components/Modal";

interface QuickActionsModalProps {
  children?: ReactNode;
  heading: string;
  open: boolean;
  index: number;
}

const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  children,
  open,
  heading,
  index,
}) => {
  const dispatch = useDispatch();
  function handleClose() {
    dispatch(setModal({ modal: { modal: "symbol", index }, value: false }));
  }

  return (
    <>
      <Modal
        title={heading}
        className={classes.modal}
        onClose={handleClose}
        open={open}
      >
        {children}
      </Modal>
    </>
  );
};

export default QuickActionsModal;
