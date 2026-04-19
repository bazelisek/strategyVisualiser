"use client";

import React, { useState } from "react";
import { Sheet, Stack, Typography } from "@mui/joy";
import { AnimatePresence, motion } from "framer-motion";
import DropdownButton from "./Input/Buttons/DropdownButton";
import TerminalIcon from "@mui/icons-material/Terminal";
import classes from "./ChartSection.module.css";

interface StrategyConsoleCollapsibleProps {
  consoleOutput: string;
  className?: string;
}

/**
 * Collapsible strategy runner log; matches the Strategy Performance expand/collapse pattern.
 */
const StrategyConsoleCollapsible: React.FC<StrategyConsoleCollapsibleProps> = ({
  consoleOutput,
  className,
}) => {
  const [open, setOpen] = useState(false);

  const trimmed = consoleOutput.trim();
  const lines = trimmed.split(/\r?\n/).filter((l) => l.length > 0);
  const firstLine = lines[0] ?? "";
  const preview =
    trimmed.length === 0
      ? "(no output)"
      : lines.length > 1
        ? `${firstLine.length > 80 ? firstLine.slice(0, 77) + "…" : firstLine} (${lines.length} lines)`
        : firstLine.length > 120
          ? `${firstLine.slice(0, 117)}…`
          : trimmed;

  return (
    <motion.div
      initial={{ opacity: 0, y: -80 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring" }}
      className={`${className ?? ""}`}
      data-testid="strategy-console-collapsible"
    >
      <Sheet
        variant="outlined"
        sx={{
          borderRadius: "lg",
          p: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <TerminalIcon color="primary" />
          <Typography fontWeight="lg">Strategy run log</Typography>
        </Stack>

        <DropdownButton onClick={() => setOpen((p) => !p)}>
          View Log
        </DropdownButton>
      </Sheet>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ overflow: "hidden" }}
          >
            <Sheet sx={{ mt: 2, p: 2, borderRadius: "lg", width: "100%" }}>
              <pre className={classes.consoleOutput}>
                {trimmed.length === 0 ? "No console output captured for this run." : consoleOutput}
              </pre>
            </Sheet>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StrategyConsoleCollapsible;
