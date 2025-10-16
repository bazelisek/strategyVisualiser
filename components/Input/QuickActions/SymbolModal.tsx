"use client";
import React, { useState, useEffect, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import QuickActionsModal from "./QuickActionsModal";
import { symbols } from "@/util/symbols";
import { motion } from "framer-motion";
import { RootState, setModal } from "@/store/reduxStore";
import { useSearchParams, useRouter } from "next/navigation";

interface SymbolModalProps {
  children?: ReactNode;
  index: number;
}

const SymbolModal: React.FC<SymbolModalProps> = ({index}) => {
  const modals = useSelector((state: RootState) => state.modals);
  const open = modals[index]?.symbol || false;
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useSearchParams();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  function handleSymbolClick(symbol: string) {
    const symbols = params.getAll("symbol");
    const strategies = params.getAll("strategy");
    const period1s = params.getAll("period1");
    const period2s = params.getAll("period2");
    const intervals = params.getAll("interval");
    const tileCount = symbols.length;

    const paramsArr: {
      symbol: string;
      strategy: string;
      period1: string;
      period2: string;
      interval: string;
    }[] = [];
    for (let i = 0; i < tileCount; i++) {
      paramsArr.push({
        symbol: symbols[i],
        strategy: strategies[i],
        interval: intervals[i],
        period1: period1s[i],
        period2: period2s[i],
      });
    }
    paramsArr[index].symbol = symbol;

    const newSearchParams = new URLSearchParams();
    paramsArr.forEach((param) => Object.entries(param).forEach(([key, value]) => newSearchParams.append(key, value)));

    router.replace(`/?${newSearchParams.toString()}`);
    dispatch(setModal({ modal: {index, modal:"symbol"}, value: false }));
  }

  // debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [search]);

  // filter only when debouncedSearch changes
  const filteredSymbols = symbols.filter((s) =>
    s.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <QuickActionsModal index={index} open={open} heading="Symbol">
      <label htmlFor="symbolSearch">Search</label>
      <input
        id="symbolSearch"
        placeholder="Key to search for"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <motion.ul
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.02 } },
        }}
        layout
      >
        {filteredSymbols.map((symbol) => (
          <motion.li
            layout
            key={symbol}
            variants={{
              hidden: { opacity: 0, scale: 0.5 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: { duration: 0.5, ease: "easeInOut" },
              },
            }}
            whileHover={{
              scale: 1.02,
              backgroundColor: "var(--accent)",
              color: "var(--background-dark)",
            }}
            onClick={() => handleSymbolClick(symbol)}
          >
            {symbol}
          </motion.li>
        ))}
      </motion.ul>
    </QuickActionsModal>
  );
};

export default SymbolModal;
