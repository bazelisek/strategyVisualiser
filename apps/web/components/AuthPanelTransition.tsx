"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import classes from "./AuthenticationModal.module.css";

interface AuthPanelTransitionProps {
  activeTab: number;
  children: ReactNode;
}

export default function AuthPanelTransition({
  activeTab,
  children,
}: AuthPanelTransitionProps) {
  return (
    <motion.div
      layout
      className={classes.panelViewport}
      transition={{ layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={activeTab}
          className={classes.animatedPanel}
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
