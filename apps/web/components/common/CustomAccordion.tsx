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
    <Sheet
      variant="outlined"
      sx={{
        borderRadius: "lg",
        p: 1.5,
        width: "100%",
      }}
      component={motion.div}
      layout
      transition={{ layout: { duration: 0.25, ease: "easeInOut" } }}
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

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
          key={'content'}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{opacity: 0, height: 0}}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`${className}`}
            style={{overflow: 'hidden'}}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
