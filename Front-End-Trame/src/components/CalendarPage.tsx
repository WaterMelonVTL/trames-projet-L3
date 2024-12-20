import React, { useState, useEffect } from 'react'
import CalendarFrame from './CalendarFrame'
import CalendarCoursSelection from './CalendarCoursSelection'
import EcuItem from './EcuItem';
import { CoursFrame, ECU} from '../types/types';


function CalendarPage(props : {data: { [key: string]: ECU[] }}) {
  //TODO: Keep the cours data when dragging, make it use an other type that can keep it.
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
      <CalendarCoursSelection setCurrentEcu={setCurrentEcu} ecus={props.data[Object.keys(props.data)[0]]}/>
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