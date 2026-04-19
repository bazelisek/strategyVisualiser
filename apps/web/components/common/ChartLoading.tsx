import React from 'react';

const ChartLoading = ({ size = 64 }) => {
  return (
    <div 
      style={{ width: size, height: size }} 
      className="flex items-center justify-center bg-transparent"
    >
      <svg
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* The "Tiny Bit Higher" Moving Average Line */}
        <path
          d="M 0 32 C 5 32, 15 11, 25 21 S 45 1, 60 11"
          stroke="#3b82f6"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          className="animate-ma-slide"
        />

        {/* High-Volatility Candles Group */}
        <g>
          {/* Candle 1 (Bullish) */}
          <g className="animate-candle-vibe" style={{ animationDelay: '0s' }}>
            <line x1="12" y1="22" x2="12" y2="38" stroke="#10b981" strokeWidth="1" />
            <rect x="10" y="26" width="4" height="8" fill="#10b981" rx="1" />
          </g>

          {/* Candle 2 (Bearish) */}
          <g className="animate-candle-vibe" style={{ animationDelay: '0.15s' }}>
            <line x1="25" y1="18" x2="25" y2="34" stroke="#ef4444" strokeWidth="1" />
            <rect x="23" y="20" width="4" height="10" fill="#ef4444" rx="1" />
          </g>

          {/* Candle 3 (Bullish) */}
          <g className="animate-candle-vibe" style={{ animationDelay: '0.3s' }}>
            <line x1="38" y1="12" x2="38" y2="28" stroke="#10b981" strokeWidth="1" />
            <rect x="36" y="16" width="4" height="6" fill="#10b981" rx="1" />
          </g>
        </g>
      </svg>

      <style jsx>{`
        @keyframes ma-slide {
          0% {
            stroke-dasharray: 0 100;
            stroke-dashoffset: 0;
            opacity: 0;
          }
          10% { opacity: 1; }
          50% {
            stroke-dasharray: 100 0;
            stroke-dashoffset: 0;
          }
          90% { opacity: 1; }
          100% {
            stroke-dasharray: 0 100;
            stroke-dashoffset: -100;
            opacity: 0;
          }
        }

        @keyframes candle-vibe {
          0%, 100% { 
            transform: translateY(0); 
          }
          45% { 
            transform: translateY(-8px); 
          }
          50% {
            transform: translateY(-8.5px) scaleY(1.1);
          }
        }

        .animate-ma-slide {
          animation: ma-slide 2.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }

        .animate-candle-vibe {
          animation: candle-vibe 1.2s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
};

export default ChartLoading;