import React, { useState } from 'react'
import EcuItem from './EcuItem'
import {ECU, CoursFrame} from '../types/types'



function CalendarCoursSelection(props: { setCurrentEcu: (ecu: CoursFrame | null) => void }) {
    const [hoveredItem, setHoveredItem] = useState<number>(-1)
    const [isSearching, setIsSearching] = useState<string>("")


    const search = (search: string) => {
        setIsSearching(search)
        if (search === "") {
            setFilteredList(ecus)
        } else {
            setFilteredList(ecus.filter(ecu => ecu.name.toLowerCase().includes(search.toLowerCase())))
        }
    }

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
        {
            name: "HAI106I",
            numberOfCM: 5,
            numberOfTD: 12,
            enseignantCM: "M. Pompidor",
            enseignantTD: ["Mme. Pompidor", "M. Montassier"],
            color: "#B0E0E6",
            AmphiParDefaut: "A5.01",
            TDParDefaut: "36.206"
        },
        {
            name: "HAI107I",
            numberOfCM: 5,
            numberOfTD: 12,
            enseignantCM: "M. Da Silva",
            enseignantTD: ["Mme. Pompidor", "M. Montassier"],
            color: "#C1E1C1",
            AmphiParDefaut: "A5.01",
            TDParDefaut: "36.206"
        }
        ,
        {
            name: "HAI108I",
            numberOfCM: 4,
            numberOfTD: 10,
            enseignantCM: "Mme. Martin",
            enseignantTD: ["Mme. Martin", "M. Leroy"],
            color: "#FFB6C1",
            AmphiParDefaut: "B2.01",
            TDParDefaut: "36.207"
        },
        {
            name: "HAI109I",
            numberOfCM: 6,
            numberOfTD: 14,
            enseignantCM: "M. Bernard",
            enseignantTD: ["M. Bernard", "Mme. Petit"],
            color: "#B19CD9",
            AmphiParDefaut: "C3.01",
            TDParDefaut: "36.208"
        },
        {
            name: "HAI110I",
            numberOfCM: 3,
            numberOfTD: 8,
            enseignantCM: "Mme. Dubois",
            enseignantTD: ["Mme. Dubois", "M. Moreau"],
            color: "#F0E68C",
            AmphiParDefaut: "D4.01",
            TDParDefaut: "36.209"
        }
    ]
    const [filteredList, setFilteredList] = useState<ECU[]>(ecus)

    return (
        <div>
            <h1 className='font-bold text-xl mb-4   '>Cours disponibles : </h1>

            <div className='min-h-20 w-[18vw] rounded-lg border-2 border-black text-xl text-black flex flex-col items-center max-h-[80vh] overflow-y-auto py-4 shadow-inner shadow-gray-300'>
                <div className='rounded-full absolute shadow-lg h-10 w-80 flex text-base font-normal bg-white border-2 border-gray-800'>
                    <input
                        type="text"
                        placeholder='Un cours en particulier?'
                        className='m-auto h-8 w-72 focus:outline-none'
                        value={isSearching}
                        onChange={(e) => search(e.target.value)}
                    />
                </div>
                <div className='mt-16 z-50'>

                </div>
                {filteredList.map((ecu, index) => (
                    <div className='flex flex-col flex-gap-2 mb-4 w-full items-center'>
                        <EcuItem darken={hoveredItem != -1 && hoveredItem != index} type="CM" ecu={ecu} onHover={() => { setHoveredItem(index) }} onLeave={() => { setHoveredItem(-1) }} onMouseDown={() => { props.setCurrentEcu({ name: ecu.name, enseignant: [ecu.enseignantCM], type: 'CM', color: ecu.color, salle: ecu.AmphiParDefaut, ecu: ecu }); setHoveredItem(-2) }} />
                        <EcuItem darken={hoveredItem != -1 && hoveredItem != index + ecus.length} type="TD" ecu={ecu} onHover={() => { setHoveredItem(index + ecus.length) }} onLeave={() => { setHoveredItem(-1) }} onMouseDown={() => { props.setCurrentEcu({ name: ecu.name, enseignant: [ecu.enseignantCM], type: 'TD', color: ecu.color, salle: ecu.TDParDefaut, ecu: ecu }) }} />
                    </div>
                ))}

            </div>
        </div>
    )
}

export default CalendarCoursSelection