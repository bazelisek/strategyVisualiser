"use client";
import React, {
  ReactNode,
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import JoyModal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import DialogTitle from "@mui/joy/DialogTitle";
import DialogContent from "@mui/joy/DialogContent";
import ModalClose from "@mui/joy/ModalClose";
import type { SxProps } from "@mui/joy/styles";
import type { Theme } from "@mui/joy/styles";

const ModalContext = createContext<React.RefObject<HTMLElement | null> | null>(null);

export const useModalRef = () => useContext(ModalContext);

interface ModalProps {
  children?: ReactNode;
  open?: boolean;
  onClose?: () => void;
  title: string;
  dialogSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  contentClassName?: string;
  size?: "sm" | "md" | "lg";
}

const Modal: React.FC<ModalProps> = ({
  open = true,
  onClose,
  title,
  children,
  dialogSx,
  contentSx,
  contentClassName,
  size = "md",
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const modalContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const handleClose = () => {
    onClose?.();
  };

  return (
    <JoyModal
      open={open}
      onClose={() => {
        handleClose();
      }}
    >
      <ModalDialog size={size} sx={dialogSx}>
        <DialogTitle>{title}</DialogTitle>
        {onClose && <ModalClose onClick={handleClose} />}
        <DialogContent sx={contentSx}>
          <div ref={modalContentRef} className={contentClassName}>
            <ModalContext.Provider value={modalContentRef}>
              {children}
            </ModalContext.Provider>
          </div>
        </DialogContent>
      </ModalDialog>
    </JoyModal>
  );
};

export default Modal;
