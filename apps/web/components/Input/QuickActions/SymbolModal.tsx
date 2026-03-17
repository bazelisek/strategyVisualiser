"use client";
import React, { useState, useEffect } from "react";
import QuickActionsModal from "./QuickActionsModal";
import { symbols } from "@/util/symbols";
import { motion } from "framer-motion";
import { useTiles } from "@/hooks/useTiles";
import { useModalController } from "@/components/ModalController";

interface SymbolModalProps {
  index: number;
}

const SymbolModal: React.FC<SymbolModalProps> = ({ index }) => {
  const { isOpen, close } = useModalController();
  const open = isOpen("symbol", index);
  const { updateTile } = useTiles();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  function handleSymbolClick(symbol: string) {
    updateTile(index, { symbol });
    close();
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
    <QuickActionsModal open={open} heading="Symbol" onClose={close}>
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
