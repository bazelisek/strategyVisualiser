import VisualizerHistory from '@/components/VisualizerHistory/VisualizerHistory';
import React, { type ReactNode } from 'react';

interface PageProps {
  children?: ReactNode;
}

const Page: React.FC<PageProps> = (props) => {
  return (
    <VisualizerHistory />
  );
};

export default Page;