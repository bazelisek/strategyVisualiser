"use client";
import { useRouter } from "next/navigation";
import React, { ReactNode } from "react";

interface ErrorProps {
  children?: ReactNode;
}

const Error: React.FC<ErrorProps> = () => {
  const router = useRouter();

  return (
    <html>
      <body>
        <div>
          <h2>Something went wrong...</h2>
          <p>Please try again later and check your internet connection.</p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </div>
      </body>
    </html>
  );
};

export default Error;
