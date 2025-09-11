"use client";
import React, { ReactNode } from "react";

interface ErrorProps {
  children?: ReactNode;
}

const Error: React.FC<ErrorProps> = () => {
  return (
    <html>
      <body>
        <div>
          <h2>Something went wrong...</h2>
          <p>Please try again later.</p>
        </div>
      </body>
    </html>
  );
};

export default Error;
