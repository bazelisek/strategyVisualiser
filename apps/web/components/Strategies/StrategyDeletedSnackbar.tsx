"use client";

import { Snackbar } from "@mui/joy";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function StrategyDeletedSnackbar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("deleted") !== "1") {
      return;
    }

    setOpen(true);
    router.replace("/strategies");
  }, [router, searchParams]);

  return (
    <Snackbar
      autoHideDuration={4000}
      color="success"
      open={open}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      variant="soft"
    >
      Strategy deleted successfully.
    </Snackbar>
  );
}
