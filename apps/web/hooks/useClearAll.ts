import { clearReduxStorage } from "@/store/reduxStorage";
import { useTiles } from "@/hooks/useTiles";

// Implementation
export default function useClearState() {
  const { setTiles, removeTile } = useTiles();
  return (tileIndexToDelete?: number) => {
    if (tileIndexToDelete === undefined) {
      setTiles([]);
      clearReduxStorage();
      return;
    }
    removeTile(tileIndexToDelete);
  };
}
