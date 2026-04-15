"use server";
import VerifyAuth from "@/auth/VerifyAuth";
import AddStrategyButton from "@/components/Strategies/AddStrategyButton";
import StrategyList from "@/components/Strategies/StrategyList";
import { Sheet } from "@mui/joy";

import { Suspense } from "react";

export default async function Page() {
  return (
    <VerifyAuth>
      <div
        style={{ display: "flex", justifyContent: "center", padding: "2rem" }}
      >
        <Sheet
          variant="soft"
          sx={{
            borderRadius: "1rem",
            padding: "2rem",
            width: { sm: "90%", md: "50%" },
          }}
        >
          <AddStrategyButton />
          <h1 style={{ textAlign: "center" }}>Strategies</h1>
          <Sheet
            variant="outlined"
            sx={{ borderRadius: "0.5rem", padding: "1rem", marginTop: "1rem" }}
          >
            <Suspense fallback={<div>Loading strategies...</div>}>
              <StrategyList />
            </Suspense>
          </Sheet>
        </Sheet>
      </div>
    </VerifyAuth>
  );
}
