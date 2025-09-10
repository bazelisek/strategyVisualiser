"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import QuickActionsModal from "./QuickActionsModal";
import { useRouter, useSearchParams } from "next/navigation";
import { setModal } from "@/store/reduxStore";
import { motion } from "framer-motion";
import { getAvailableStrategies } from "@/util/strategies";

interface StrategyModalProps {
  children?: ReactNode;
}

const StrategyModal: React.FC<StrategyModalProps> = () => {
  const modals = useSelector((state: any) => state.modals);
  const open = modals.strategy;
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [strategies, setStrategies] = useState<string[]>([]);

  function handleStrategyClick(strategy: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("strategy", strategy);
    router.replace(`?${params.toString()}`);
    dispatch(setModal({ modal: "strategy", value: false }));
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
    <QuickActionsModal open={open} heading="Strategy">
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
