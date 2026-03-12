import { clearReduxStorage } from "@/store/reduxStorage";
import { useTiles } from "@/hooks/useTiles";

// Implementation
export default function useClearState() {
  const { setTiles, removeTile } = useTiles();
  return (tileIndexToDelete?: number | unknown) => {
    if (typeof tileIndexToDelete !== "number") {
      setTiles([]);
      clearReduxStorage();
      return;
    }
    removeTile(tileIndexToDelete);
  };
}
