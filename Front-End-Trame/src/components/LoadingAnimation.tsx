import React, { useState, useEffect } from 'react'

interface LoadingAnimationProps {
  colors: string[]
  texte: string
}

function LoadingAnimation({ colors, texte }: LoadingAnimationProps) {
  // Initialize state for 4 dots, using first colors from prop array
  const [dotColors, setDotColors] = useState<string[]>([
    colors[0] || '#ff0066',
    colors[1] || '#66ff00',
    colors[2] || '#0066ff',
    colors[3] || '#ffcc00'
  ])

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
      <div className=" text-xl drop-shadow-md"
      style={{color: dotColors[0]}}>
        {texte}
      </div>
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
      `}</style>
    </div>
  )
}

export default LoadingAnimation