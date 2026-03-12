import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import { clearReduxData } from "./reduxStore";

// 1. Create a fallback for environments without window (SSR/Testing)
const createNoopStorage = () => ({
  getItem(_key: string) {
    void _key;
    return Promise.resolve(null);
  },
  setItem(_key: string, value: string) {
    void _key;
    return Promise.resolve(value);
  },
  removeItem(_key: string) {
    void _key;
    return Promise.resolve();
  },
});

// 2. Select the storage engine based on the environment
const storage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : createNoopStorage();

/**
 * Clear persisted redux storage.
 * - If `keys` is omitted, removes all keys starting with `persist:`.
 * - If `keys` is provided, removes those specific storage keys (exact match).
 */
export async function clearReduxStorage(keys?: string | string[]): Promise<void> {
  clearReduxData();
  // helper to remove a single key using storage API or fallback
  const removeKey = async (k: string) => {
    try {
      await storage.removeItem(k);
    } catch {
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.removeItem(k);
        } catch {}
      }
    }
  };

  if (!keys) {
    // remove all keys that look like redux-persist keys (persist:...)
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        // collect keys to avoid modifying the storage while iterating
        const toRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith("persist:")) toRemove.push(key);
        }
        await Promise.all(toRemove.map((k) => removeKey(k)));
        return;
      }
    } catch {
      // fallback: try common persist keys
    }

    // best-effort fallback: remove typical keys
    await Promise.all([
      removeKey("persist:root"),
      removeKey("persist:indicators"),
    ]);
    return;
  }

  // remove only specified keys (accept single string or array)
  const ks: string[] = typeof keys === "string" ? [keys] : Array.isArray(keys) ? keys : [];
  if (ks.length === 0) return;
  await Promise.all(ks.map((k) => removeKey(k)));
}

export default storage;
