"use client";
import React, { useState, useEffect, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import QuickActionsModal from "./QuickActionsModal";
import { assetUniverse, getSymbolDisplayLabel } from "@/util/symbols";
import { motion } from "framer-motion";
import { RootState, setModal } from "@/store/reduxStore";
import { useTiles } from "@/hooks/useTiles";

interface SymbolModalProps {
  children?: ReactNode;
  index: number;
}

const SymbolModal: React.FC<SymbolModalProps> = ({index}) => {
  const modals = useSelector((state: RootState) => state.modals);
  const open = modals[index]?.symbol || false;
  const dispatch = useDispatch();
  const { updateTile } = useTiles();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  function handleSymbolClick(symbol: string) {
    updateTile(index, { symbol });
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
  const filteredSymbols = assetUniverse.filter((asset) => {
    const query = debouncedSearch.toLowerCase();
    return (
      asset.symbol.toLowerCase().includes(query) ||
      asset.name.toLowerCase().includes(query)
    );
  });

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
        {filteredSymbols.map((asset) => (
          <motion.li
            layout
            key={asset.symbol}
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
            onClick={() => handleSymbolClick(asset.symbol)}
          >
            {getSymbolDisplayLabel(asset.symbol)}
          </motion.li>
        ))}
      </motion.ul>
    </QuickActionsModal>
  );
};

export default SymbolModal;
