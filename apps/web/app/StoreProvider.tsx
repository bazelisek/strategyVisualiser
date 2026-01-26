'use client';
import React from 'react';
import dynamic from 'next/dynamic';

// 1. Dynamically import the ReduxWrapper with SSR disabled
const ReduxWrapper = dynamic(() => import('@/store/ReduxWrapper'), {
  ssr: false,
});

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReduxWrapper>
      {children}
    </ReduxWrapper>
  );
}