import type { RootState } from "@/store/reduxStore";
import type { stateType } from "@/store/slices/indicatorSlice";
import { useSelector } from "react-redux";

// Overload 1: If a function is provided, return its return type T
export default function useIndicators<T>(f: (indicators: stateType[]) => T): T;

// Overload 2: If no function is provided, return the raw array
export default function useIndicators(): stateType[];

// Implementation
export default function useIndicators<T>(f?: (indicators: stateType[]) => T): T | stateType[] {
  // Always call the hook at the top level
  const indicators = useSelector((state: RootState) => state.indicators);

  // Then perform the conditional logic on the data, not the hook call
  if (f) {
    return f(indicators);
  }
  
  return indicators;
}