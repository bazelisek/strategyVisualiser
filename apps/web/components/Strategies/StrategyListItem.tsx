'use client'

import { Strategy } from '@/util/strategies/strategies';
import { ListItem, ListItemButton } from '@mui/joy';
import { useRouter } from 'next/navigation';
import React, { type ReactNode } from 'react';

interface StrategyListItemProps {
  strategy: Strategy;
}

const StrategyListItem: React.FC<StrategyListItemProps> = ({strategy}) => {
    const router = useRouter();
    function handleStrategyClick(id: string) {
    router.push("/strategies/" + id);
  }
  return (
    <ListItem key={strategy.id}>
              <ListItemButton onClick={() => handleStrategyClick(strategy.id.toString())}>{strategy.name}</ListItemButton>
            </ListItem>
  );
};

export default StrategyListItem;