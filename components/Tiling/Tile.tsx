import React, { ReactNode } from 'react';
import QuickActions from '../Input/QuickActions/QuickActions';
import ChartSection from '../ChartSection';
import StrategyModal from '../Input/QuickActions/StrategyModal';
import SymbolModal from '../Input/QuickActions/SymbolModal';

interface TileProps {
  children?: ReactNode;
  index: number;
}

const Tile: React.FC<TileProps> = ({index}) => {
  return (
    <div>
        <QuickActions index={index} />
        <ChartSection index={index} /> {/*Need to adjust chart fetching to fetch dynamically based on index*/}
        <SymbolModal index={index} />
        <StrategyModal index={index} />
    </div>
  );
};

export default Tile;