'use client'
import React, { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import QuickActionsModal from "./QuickActionsModal";

interface SymbolModalProps {
  children?: ReactNode;
}

const SymbolModal: React.FC<SymbolModalProps> = (props) => {
  const modals = useSelector((state: any) => state.modals);
  const open = modals.symbol;
  const dispatch = useDispatch();
  return (<QuickActionsModal open={open} heading="Symbol">SymbolModal</QuickActionsModal>);
};

export default SymbolModal;
