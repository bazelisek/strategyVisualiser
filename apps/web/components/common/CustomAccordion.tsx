import { Stack } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useState } from "react";
import DropdownButton from "../Input/Buttons/DropdownButton";
import { Sheet } from "@mui/joy";

export default function CustomAccordion({
  summary,
  children,
  className,
}: {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: -120 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring" }}
      className={`${className}`}
    >
      <Sheet
        variant="outlined"
        sx={{
          borderRadius: "lg",
          p: 1.5,
          width: "100%",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
        >
          {summary}

          <DropdownButton onClick={() => setOpen((p) => !p)}></DropdownButton>
        </Stack>

        <AnimatePresence>{open && children}</AnimatePresence>
      </Sheet>
    </motion.div>
  );
}
