import React, { useState } from 'react'
import EcuItem from './EcuItem'

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

function CalendarCoursSelection(props : {setCurrentEcu : (ecu : CoursFrame) => void}) {
    const [hoveredItem,setHoveredItem] = useState<number>(-1)
    const ecus = [
        {
            name: "HAI104I",
            numberOfCM: 3,
            numberOfTD: 12,
            enseignantCM: "M. Dupont",
            enseignantTD: ["M. Dupont", "M. Boudet"],
            color: "#FFB3BA",
            AmphiParDefaut: "36.1",
            TDParDefaut: "36.206"
        },
        {
            name: "HAI105I",
            numberOfCM: 5,
            numberOfTD: 12,
            enseignantCM: "Mme. Nebut",
            enseignantTD: ["Mme. Nebut", "M. Montassier"],
            color: "#FFDFBA",
            AmphiParDefaut: "A5.01",
            TDParDefaut: "36.206"
        },
    ]
    return (
        <div className='min-h-20 w-[18vw] rounded-lg border-2 border-black text-xl text-black flex flex-col items-center'>
            <h1 className='font-bold text-xl mb-4'>Cours disponibles : </h1>
            {ecus.map((ecu, index) => (
                <div className='flex flex-col flex-gap-2 mb-4 w-full items-center'>
                    <EcuItem darken={hoveredItem!=-1 && hoveredItem!=index} type="CM" ecu={ecu} onHover={()=>{setHoveredItem(index)}} onLeave={()=>{setHoveredItem(-1)}} onMouseDown={()=>{props.setCurrentEcu()}}/>
                    <EcuItem darken={hoveredItem!=-1 && hoveredItem!=index+ecus.length} type="TD" ecu={ecu} onHover={()=>{setHoveredItem(index+ecus.length)}} onLeave={()=>{setHoveredItem(-1)}} onMouseDown={()=>{props.setCurrentEcu()}}/>
                </div>
            ))}

        </div>
    )
}

export default CalendarCoursSelection