import { clearReduxStorage } from "@/store/reduxStorage";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  readTilesFromSearchParams,
  writeTilesToSearchParams,
} from "@/util/tilesSearchParams";

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
    const tiles = readTilesFromSearchParams(params);
    const nextTiles = tiles.filter((_, i) => i !== tileIndexToDelete);
    const q = writeTilesToSearchParams(nextTiles);
    router.replace(q ? `${path}?${q}` : path);
  };
}
