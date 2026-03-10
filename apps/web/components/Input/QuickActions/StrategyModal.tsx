"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import QuickActionsModal from "./QuickActionsModal";
import { RootState, setModal } from "@/store/reduxStore";
import { motion } from "framer-motion";
import { getAvailableStrategies } from "@/util/strategies";
import { useSearchParams, useRouter } from "next/navigation";
import { CircularProgress } from "@mui/joy";
import {
  readTilesFromSearchParams,
  writeTilesToSearchParams,
} from "@/util/tilesSearchParams";

interface StrategyModalProps {
  children?: ReactNode;
  index: number;
}

const StrategyModal: React.FC<StrategyModalProps> = ({ index }) => {
  const modals = useSelector((state: RootState) => state.modals);
  const open = modals[index]?.strategy || false;
  const dispatch = useDispatch();
  const router = useRouter();
  const params = useSearchParams();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [strategies, setStrategies] = useState<string[]>([]);

  function handleStrategyClick(strategy: string) {
    const tiles = readTilesFromSearchParams(params);
    const nextTiles = tiles.map((t, i) =>
      i === index ? { ...t, strategy } : t,
    );
    router.replace(`/?${writeTilesToSearchParams(nextTiles)}`);
    dispatch(setModal({ modal: { index, modal: "strategy" }, value: false }));
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
    s.toLowerCase().includes(debouncedSearch.toLowerCase()),
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
      {!strategies && (
        <div className="loading">
          <CircularProgress />
        </div>
      )}
    </QuickActionsModal>
  );
};

export default StrategyModal;
