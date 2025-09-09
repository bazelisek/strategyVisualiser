'use client'
import React, { ReactNode } from 'react';

interface ErrorProps {
  children?: ReactNode;
}

const Error: React.FC<ErrorProps> = (props) => {
  return (
    <div>
      error
    </div>
  );
};

export default Error;