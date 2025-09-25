import { AnimatePresence, motion } from 'framer-motion';
import React, { ReactNode } from 'react';
import classes from "./Modal.module.css";

interface ModalProps {
  children?: ReactNode;
  open?: boolean;
  onClose?: () => void;
  title: string;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({open = true, onClose, title, children, className}) => {
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.dialog
            layout
            initial={{ opacity: 0, y: -400 }}
            animate={{ opacity: 1, y: 0, transition: {type: 'spring', ease: 'easeIn', duration: 0.5} }}
            exit={{ opacity: 0, y: -400, transition: {type: 'tween', ease: 'easeIn', duration: 0.25} }}
            open
            className={`${classes.modal} ${className}`}
            onClose={onClose}
          >
            <div className={classes.header}>
              <h2>{title}</h2>
              <button onClick={onClose}>&#10005;</button>
            </div>
            {children}
          </motion.dialog>
        )}
      </AnimatePresence>
    </>
  );
};

export default Modal;