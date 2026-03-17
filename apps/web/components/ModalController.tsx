"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ModalKind = "indicators" | "symbol" | "strategy";

type ModalState = {
  kind: ModalKind | null;
  index: number | null;
};

type ModalController = {
  state: ModalState;
  open: (kind: ModalKind, index: number) => void;
  close: () => void;
  toggle: (kind: ModalKind, index: number) => void;
  isOpen: (kind: ModalKind, index: number) => boolean;
};

const ModalControllerContext = createContext<ModalController | null>(null);

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<ModalState>({ kind: null, index: null });

  const open = useCallback((kind: ModalKind, index: number) => {
    setState({ kind, index });
  }, []);

  const close = useCallback(() => {
    setState({ kind: null, index: null });
  }, []);

  const toggle = useCallback((kind: ModalKind, index: number) => {
    setState((current) => {
      if (current.kind === kind && current.index === index) {
        return { kind: null, index: null };
      }
      return { kind, index };
    });
  }, []);

  const isOpen = useCallback(
    (kind: ModalKind, index: number) =>
      state.kind === kind && state.index === index,
    [state]
  );

  const value = useMemo(
    () => ({ state, open, close, toggle, isOpen }),
    [state, open, close, toggle, isOpen]
  );

  return (
    <ModalControllerContext.Provider value={value}>
      {children}
    </ModalControllerContext.Provider>
  );
};

export const useModalController = () => {
  const context = useContext(ModalControllerContext);
  if (!context) {
    throw new Error("useModalController must be used within ModalProvider");
  }
  return context;
};
