import React, { useState } from 'react'
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
  const [currentEcu,setCurrentEcu] = useState<CoursFrame | null>(null)
  return (
    <div className="w-screen h-screen bg-gray-200 flex justify-around items-start pt-8">
      <CalendarCoursSelection setCurrentEcu={currentEcu}/>
      <CalendarFrame currentEcu={setCurrentEcu}/>
      {
        currentEcu &&
        <div className="absolute">
          <EcuItem darken={false} type={currentEcu.type} ecu={currentEcu.ecu} onHover={()=>{}} onLeave={()=>{}}/>
        </div>
      }
    </div>
    
  )
}

export default CalendarPage