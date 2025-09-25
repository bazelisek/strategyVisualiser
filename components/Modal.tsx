import { AnimatePresence, motion } from 'framer-motion';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classes from './Modal.module.css';

interface ModalProps {
  children?: ReactNode;
  open?: boolean;
  onClose?: () => void;
  title: string;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  open = true,
  onClose,
  title,
  children,
  className,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const modalContentRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setIsMounted(true);
    // Optional: Add and remove a class on the body to prevent scrolling when modal is open
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const modalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={classes.modal} // This will be the backdrop now
          onClick={onClose} // Close when clicking the backdrop
        >
          <motion.dialog
            layout
            initial={{ opacity: 0, y: -300 }}
            animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } }}
            exit={{ opacity: 0, y: -300, transition: { duration: 0.2 } }}
            open
            className={`${classes.modalContent} ${className}`} // Renamed for clarity
            ref={modalContentRef}
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
            onClose={onClose}
          >
            <div className={classes.header}>
              <h2>{title}</h2>
              <button onClick={onClose}>&#10005;</button>
            </div>
            {/* Pass the ref down to children that need it */}
            {React.isValidElement(children)
              ? React.cloneElement(children as React.ReactElement<any>, { modalContainerRef: modalContentRef })
              : children}
          </motion.dialog>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!isMounted) {
    return null;
  }

  return createPortal(modalContent, document.body);
};

export default Modal;