"use client";
import React, { ReactNode } from "react";
import classes from "./QuickActionsModal.module.css";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { setModal } from "@/store/reduxStore";

interface QuickActionsModalProps {
  children?: ReactNode;
  heading: string;
  open: boolean;
}

const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  children,
  open,
  heading,
}) => {
  const dispatch = useDispatch();
  function handleClose(
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.SyntheticEvent<HTMLDialogElement, Event>
  ) {
    e.preventDefault();
    dispatch(setModal({ modal: "symbol", value: false }));
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.dialog
            initial={{ opacity: 0, y: -400 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { type: "spring", ease: "easeIn", duration: 0.5 },
            }}
            exit={{
              opacity: 0,
              y: -400,
              transition: { type: "tween", ease: "easeIn", duration: 0.25 },
            }}
            open
            className={classes.modal}
            onClose={handleClose}
          >
            <div className={classes.header}>
              <h2>{heading}</h2>
              <button onClick={handleClose}>&#10005;</button>
            </div>
            {children}
          </motion.dialog>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickActionsModal;
