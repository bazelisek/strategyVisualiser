'use client';
import React, { ReactNode } from "react";
import classes from "./QuickActionsModal.module.css";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { setModal } from "@/store/reduxStore";

interface QuickActionsModalProps {
  children?: ReactNode;
  heading: string;
  open: boolean;
}

const QuickActionsModal: React.FC<QuickActionsModalProps> = ({ open, heading }) => {
  const modals = useSelector((state: any) => state.modals);
  const dispatch = useDispatch();
  function handleClose(e: any) {
    e.preventDefault();
    dispatch(setModal({modal: 'symbol', value: false}));
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.dialog
            layout
            initial={{ opacity: 0, y: -200 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -200 }}
            open
            className={classes.modal}
            onClose={handleClose}
          >
            <div className={classes.header}>
              <h2>{heading}</h2>
              <button onClick={handleClose}>&#10005;</button>
            </div>
            <ul></ul>
          </motion.dialog>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickActionsModal;
