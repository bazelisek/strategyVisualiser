import { clearReduxStorage } from "@/store/reduxStorage";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

// Implementation
export default function useClearState(tileIndexToDelete?: number) {
  // Always call the hook at the top level
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  return () => {
    if (tileIndexToDelete === undefined) {
      // replace to the pathname (no query) using the app-router replace API
      router.replace(path);
      clearReduxStorage();
      return;
    }
    const newParams = new URLSearchParams(params.toString());
    ["symbol", "strategy", "period1", "period2", "interval"].forEach(
      (param) => {
        const curParams = params.getAll(param);
        curParams.forEach((value, index) => {
          if (index === tileIndexToDelete) {
            newParams.delete(param);
          }
        });
      },
    );
  };
}
