"use client";
import React, { ReactNode } from "react";

interface ErrorProps {
  children?: ReactNode;
}

const Error: React.FC<ErrorProps> = () => {
  return (
    <div>
      <h2>Something went wrong...</h2>
      <p>Please try again later and check your internet connection.</p>
      <button onClick={() => window.location.reload()}>Try again</button>
    </div>
  );
};

export default Error;
