import { clearReduxStorage } from "@/store/reduxStorage";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

// Implementation
export default function useClearState() {
  // Always call the hook at the top level
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  return (tileIndexToDelete?: number) => {
    if (tileIndexToDelete === undefined) {
      // replace to the pathname (no query) using the app-router replace API
      router.replace(path);
      clearReduxStorage();
      return;
    }
    // Rebuild params while skipping the entries that belong to the deleted tile index.
    const symbols = params.getAll("symbol");
    const strategies = params.getAll("strategy");
    const period1s = params.getAll("period1");
    const period2s = params.getAll("period2");
    const intervals = params.getAll("interval");

    const count = Math.max(
      symbols.length,
      strategies.length,
      period1s.length,
      period2s.length,
      intervals.length,
    );

    const rebuilt = new URLSearchParams();
    for (let i = 0; i < count; i++) {
      if (i === tileIndexToDelete) continue;
      if (symbols[i] !== undefined) rebuilt.append("symbol", symbols[i]);
      if (strategies[i] !== undefined) rebuilt.append("strategy", strategies[i]);
      if (intervals[i] !== undefined) rebuilt.append("interval", intervals[i]);
      if (period1s[i] !== undefined) rebuilt.append("period1", period1s[i]);
      if (period2s[i] !== undefined) rebuilt.append("period2", period2s[i]);
    }

    const q = rebuilt.toString();
    router.replace(q ? `${path}?${q}` : path);
  };
}
