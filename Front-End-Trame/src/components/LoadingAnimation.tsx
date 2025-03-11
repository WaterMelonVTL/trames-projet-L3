import React, { useState, useEffect } from 'react'

interface LoadingAnimationProps {
  colors: string[]
  texte: string,
  percentage: number | undefined
}

function LoadingAnimation({ colors, texte, percentage }: LoadingAnimationProps) {
  // Initialize state for 4 dots, using first colors from prop array
  const [dotColors, setDotColors] = useState<string[]>(colors)

  useEffect(() => {
    const interval = setInterval(() => {
      setDotColors(prev =>
        prev.map(c => {
          const i = colors.indexOf(c)
          const nextIndex = (i + 1) % colors.length
          return colors[nextIndex]
        })
      )
      console.log(dotColors)
    }, 1000)
    return () => clearInterval(interval)
  }, [colors])

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="relative w-24 h-24 mb-5">
        <div
          style={{ backgroundColor: dotColors[0] }}
          className="absolute w-5 h-5 rounded-full animate-[move1_2s_ease-in-out_infinite] transition-colors duration-300"
        ></div>
        <div
          style={{ backgroundColor: dotColors[0] }}
          className="absolute w-5 h-5 rounded-full animate-[move2_2s_ease-in-out_infinite] transition-colors duration-300"
        ></div>
        <div
          style={{ backgroundColor: dotColors[0] }}
          className="absolute w-5 h-5 rounded-full animate-[move3_2s_ease-in-out_infinite] transition-colors duration-300"
        ></div>
        <div
          style={{ backgroundColor: dotColors[0] }}
          className="absolute w-5 h-5 rounded-full animate-[move4_2s_ease-in-out_infinite] transition-colors duration-300"
        ></div>
      </div>
      <div
        className="text-xl drop-shadow-md text-gray-800 mb-4"
        >
        {texte}
      </div>

      {/* Progress bar - only show when percentage is provided */}
      {percentage !== undefined && (
        <div className="w-64 bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden border border-gray-800">
          <div
            className="h-2.5 rounded-full transition-all duration-300 progress-bar-animated"
            style={{
              width: `${percentage}%`,
              backgroundColor: dotColors[0],
              position: 'relative',
            }}
          ></div>
        </div>
      )}
      <style>{`
        @keyframes move1 {
          0% { top: 0; left: 0; }
          50% { top: 80%; left: 80%; }
          100% { top: 0; left: 0; }
        }
        @keyframes move2 {
          0% { top: 0; right: 0; }
          50% { top: 80%; right: 80%; }
          100% { top: 0; right: 0; }
        }
        @keyframes move3 {
          0% { bottom: 0; left: 0; }
          50% { bottom: 80%; left: 80%; }
          100% { bottom: 0; left: 0; }
        }
        @keyframes move4 {
          0% { bottom: 0; right: 0; }
          50% { bottom: 80%; right: 80%; }
          100% { bottom: 0; right: 0; }
        }
        
        .progress-bar-animated {
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
        }
        
        .progress-bar-animated::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.6), transparent);
          transform: translateX(-100%);
          animation: shimmer-wave 1.5s infinite ease-in-out;
        }
        
        @keyframes shimmer-wave {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

export default LoadingAnimation