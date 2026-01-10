"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import QuickActionsModal from "./QuickActionsModal";
import { RootState, setModal } from "@/store/reduxStore";
import { motion } from "framer-motion";
import { getAvailableStrategies } from "@/util/strategies";
import { useSearchParams, useRouter } from "next/navigation";

interface StrategyModalProps {
  children?: ReactNode;
  index: number;
}

const StrategyModal: React.FC<StrategyModalProps> = ({index}) => {
  const modals = useSelector((state: RootState) => state.modals);
  const open = modals[index]?.strategy || false;
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useSearchParams();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [strategies, setStrategies] = useState<string[]>([]);

  function handleStrategyClick(strategy: string) {
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
    paramsArr[index].strategy = strategy;

    const newSearchParams = new URLSearchParams();
    paramsArr.forEach((param) => Object.entries(param).forEach(([key, value]) => newSearchParams.append(key, value)));

    router.replace(`/?${newSearchParams.toString()}`);
    dispatch(setModal({ modal: {index, modal: "strategy"}, value: false }));
  }

  useEffect(() => {
    async function handleFetch() {
      setStrategies(await getAvailableStrategies());
    }
    handleFetch();
  }, []);

  // debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [search]);

  // filter only when debouncedSearch changes
  const filteredStrategies = strategies.filter((s) =>
    s.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <QuickActionsModal index={index} open={open} heading="Strategy">
      <label htmlFor="strategySearch">Search</label>
      <input
        id="strategySearch"
        placeholder="Strategy to search for"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {strategies && (
        <motion.ul
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.02 } },
          }}
          layout
        >
          {filteredStrategies.map((strategy) => (
            <motion.li
              layout
              key={strategy}
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
              onClick={() => handleStrategyClick(strategy)}
            >
              {strategy}
            </motion.li>
          ))}
        </motion.ul>
      )}
      {!strategies && <p>Loading...</p>}
    </QuickActionsModal>
  );
};

export default StrategyModal;
