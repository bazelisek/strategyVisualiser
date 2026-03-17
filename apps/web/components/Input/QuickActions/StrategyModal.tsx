"use client";

import React, { useEffect, useState } from "react";
import QuickActionsModal from "./QuickActionsModal";
import { motion } from "framer-motion";
import { getAvailableStrategies } from "@/util/strategies";
import { CircularProgress } from "@mui/joy";
import { useTiles } from "@/hooks/useTiles";
import { useModalController } from "@/components/ModalController";

interface StrategyModalProps {
  index: number;
}

const StrategyModal: React.FC<StrategyModalProps> = ({ index }) => {
  const { isOpen, close } = useModalController();
  const open = isOpen("strategy", index);
  const { updateTile } = useTiles();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [strategies, setStrategies] = useState<string[]>([]);

  function handleStrategyClick(strategy: string) {
    updateTile(index, { strategy });
    close();
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
    <QuickActionsModal open={open} heading="Strategy" onClose={close}>
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
