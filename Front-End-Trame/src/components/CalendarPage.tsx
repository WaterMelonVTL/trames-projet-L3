import React, { useState, useEffect } from 'react'
import CalendarFrame from './CalendarFrame'
import CalendarCoursSelection from './CalendarCoursSelection'
import EcuItem from './EcuItem';

type ECU = {
  name: string,
  numberOfCM: number,
  numberOfTD: number,
  enseignantCM: string,
  enseignantTD: string[],
  color: string,
  AmphiParDefaut: string,
  TDParDefaut: string
};

type CoursFrame = {
  name: string,
  enseignant: string[],
  type: string,
  color: string,
  salle: string,
  ecu : ECU
};

function CalendarPage() {
  const [currentEcu, setCurrentEcu] = useState<CoursFrame | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-gray-200 flex justify-around items-start pt-8"
      onMouseUp={() => { setCurrentEcu(null) }}>
      <CalendarCoursSelection setCurrentEcu={setCurrentEcu} />
      <CalendarFrame setCurrentEcu={setCurrentEcu} currentEcu={currentEcu} />
      {
        currentEcu &&
        <div className="absolute z-[100] -translate-x-1/2 translate-y-1/2 text-black text-xl w-80" style={{ top: `${mousePosition.y}px`, left: `${mousePosition.x}px` }}>
          <EcuItem darken={false} type={currentEcu.type} ecu={currentEcu.ecu} onHover={() => { }} onLeave={() => { }} onMouseDown={() => { }} />
        </div>
      }
    </div>
  )
}

export default CalendarPage