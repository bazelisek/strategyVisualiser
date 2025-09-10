'use client'

import React, { ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import QuickActionsModal from './QuickActionsModal';

interface StrategyModalProps {
  children?: ReactNode;
}

const StrategyModal: React.FC<StrategyModalProps> = (props) => {
  const modals = useSelector((state: any) => state.modals);
  const open = modals.strategy;
  const dispatch = useDispatch();
  return (<QuickActionsModal open={open} heading="Strategy">StrategyModal</QuickActionsModal>);
};

export default StrategyModal;