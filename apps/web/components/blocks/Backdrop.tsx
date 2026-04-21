import { Box } from "@mui/joy";
import React from "react";

const Backdrop: React.FC = () => {
  const horizontal = Array.from({ length: 11 }, (_, i) => i * 10);
  const vertical = Array.from({ length: 21 }, (_, i) => i * 5);

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        // FIX 1: Push the backdrop behind the content
        zIndex: -1, 
        // FIX 2: Ensure the backdrop ignores all mouse/touch events
        pointerEvents: "none", 
      }}
    >
      {/* Background (radial gradient) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, rgba(7, 18, 28, 0.2) 0%, rgba(7, 18, 28, 0.6) 70%, rgba(7, 18, 28, 1) 100%)",
        }}
      />

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        {/* Fade-out mask (bottom fade) */}
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          <mask id="fadeMask">
            <rect width="100" height="100" fill="url(#fade)" />
          </mask>
        </defs>

        {/* GRID */}
        <g mask="url(#fadeMask)">
          {horizontal.map((value) => (
            <line
              key={`h-${value}`}
              x1="0"
              y1={value}
              x2="100"
              y2={value}
              stroke="rgba(148, 163, 184, 0.10)"
              strokeWidth="0.05"
            />
          ))}

          {vertical.map((value) => (
            <line
              key={`v-${value}`}
              x1={value}
              y1="0"
              x2={value}
              y2="100"
              stroke="rgba(148, 163, 184, 0.06)"
              strokeWidth="0.05"
            />
          ))}
        </g>
      </svg>
    </Box>
  );
};

export default Backdrop;