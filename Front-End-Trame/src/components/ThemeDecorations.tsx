import React from 'react';
import Snowfall from 'react-snowfall';
import Confetti from 'react-confetti';
import EggsParticles from './EggParticles';
import HeartsParticles from './HeartParticles';

interface ThemeDecorationsProps {
  theme: string;
}

const ThemeDecorations: React.FC<ThemeDecorationsProps> = ({ theme }) => {
  if (theme === 'noel') {
    return (
        <div className="pointer-events-none">
        <div
          className="absolute w-full h-16 top-0 z-[999] -translate-y-[17%] left-0"
          style={{
            backgroundImage: 'url(/assets/noel2.png)',
            backgroundRepeat: 'repeat-x',
            backgroundSize: 'auto 100%',
            backgroundPosition: 'center top',
          }}
        />
        <Snowfall color="white" style={{ zIndex: 200 }} />
      </div>
    );
  }

  if (theme === 'mexicain') {
    return (
        <div className="pointer-events-none">
        <div
          className="absolute left-0 w-full h-16 top-0 z-[999]"
          style={{
            backgroundImage: 'url(/assets/mexicain.png)',
            backgroundRepeat: 'repeat-x',
            backgroundSize: 'contain',
            backgroundPosition: 'center top',
          }}
        />
        <div className="absolute left-0 w-full top-0 -mt-4 flex justify-center z-[999]">
        <svg width="600" height="200" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#43A047', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#FDD835', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#E53935', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            <image 
            href="/assets/hat.svg" 
            x="40" 
            y="55" 
            width="125" 
            height="125" 
        />
            <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                style={{ fontFamily: 'Pacifico, cursive', fontSize: 56, fill: 'url(#grad1)' }} 
                dy=".5em"
            >
                Tramex
            </text>
            <image 
            href="/assets/cactus.svg" 
            x="405" 
            y="40" 
            width="125" 
            height="125" 
        />
        </svg>
        </div>
        {/* Sun effect */}
        <div
          className="absolute top-12 left-6 w-16 h-16 z-[999] animate-pulse"
          style={{
            backgroundImage: 'url(/assets/sun.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={200}
          recycle={false}
        />
      </div>
    );
  }

  if (theme === 'paques') {
    return (
        <div className="pointer-events-none">
        <div
          className="absolute w-full h-16 top-0 z-[999] -translate-y-[17%] left-0"
          style={{
            backgroundImage: 'url(/assets/paques.png)',
            backgroundRepeat: 'repeat-x',
            backgroundSize: 'contain',
            backgroundPosition: 'center top',
          }}
        />
        {/* SVG text container positioned just below the image */}
            <div className="absolute left-0 w-full top-0 -mt-4 flex justify-center z-[999]">
            <svg width="600" height="200" xmlns="http://www.w3.org/2000/svg">
        <image 
            href="/assets/egg1.svg" 
            x="50" 
            y="75" 
            width="50" 
            height="50" 
        />
        <text 
            x="50%" 
            y="50%" 
            textAnchor="middle" 
            className="paques-title" 
            dy=".3em"
        >
            Joyeuses Pâques
        </text>
        <image 
            href="/assets/egg2.svg" 
            x="500" 
            y="75" 
            width="50" 
            height="50" 
        />
        </svg>

            </div>
        <div
            className="absolute top-16 left-8 w-12 h-12 z-[999] animate-pulse"
            style={{
                backgroundImage: 'url(/assets/bunny.svg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
          }}
        />
        {/* Eggs falling effect */}
        <div className="absolute inset-0 z-[900]">
            <EggsParticles />
        </div>
      </div>
    );
  }

  if (theme === 'valentin') {
    return (
        <div className="pointer-events-none">
        <div
          className="absolute w-full h-16 top-0 z-[999] -translate-y-[17%] left-0"
          style={{
            backgroundImage: 'url(/assets/valentin.png)',
            backgroundRepeat: 'repeat-x',
            backgroundSize: 'contain',
            backgroundPosition: 'center top',
          }}
        />
        {/* SVG text container positioned just below the image */}
<div className="absolute left-0 w-full top-0 -mt-4 flex justify-center z-[999]">
  <svg width="600" height="200" xmlns="http://www.w3.org/2000/svg">
    <image 
      href="/assets/heart1.svg" 
      x="50" 
      y="75" 
      width="50" 
      height="50" 
    />
    <text 
      x="50%" 
      y="50%" 
      textAnchor="middle" 
      className="title" 
      dy=".5em"
    >
      Joyeuse St. Valentin
    </text>
    <image 
      href="/assets/heart2.svg" 
      x="525" 
      y="75" 
      width="70" 
      height="70" 
    />
  </svg>
</div>


        <div
            className="absolute top-16 left-8 w-12 h-12 z-[999] animate-pulse"
            style={{
                backgroundImage: 'url(/assets/heart.svg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
          }}
        />  
         {/* Hearts falling effect */}
         <div className="absolute inset-0 z-[900]">
            <HeartsParticles />
        </div>
      </div>
    );
  }

  return null;
};

export default ThemeDecorations;
