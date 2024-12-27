import React, { useState } from 'react'
import EcuItem from './EcuItem'
import {ECU, CoursFrame} from '../types/types'



function CalendarCoursSelection(props: { setCurrentEcu: (ecu: CoursFrame | null) => void, ecus: ECU[] }) {
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

    const ecus = props.ecus;
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
                {filteredList ? filteredList.map((ecu, index) => (
                    <div className='flex flex-col flex-gap-2 mb-4 w-full items-center'>
                        <EcuItem darken={hoveredItem != -1 && hoveredItem != index} type="CM" ecu={ecu} onHover={() => { setHoveredItem(index) }} onLeave={() => { setHoveredItem(-1) }} onMouseDown={() => { props.setCurrentEcu({ name: ecu.name, enseignant: [ecu.enseignantCM], type: 'CM', color: ecu.color, salle: ecu.AmphiParDefaut, ecu: ecu }); setHoveredItem(-2) }} />
                        <EcuItem darken={hoveredItem != -1 && hoveredItem != index + ecus.length} type="TD" ecu={ecu} onHover={() => { setHoveredItem(index + ecus.length) }} onLeave={() => { setHoveredItem(-1) }} onMouseDown={() => { props.setCurrentEcu({ name: ecu.name, enseignant: [ecu.enseignantCM], type: 'TD', color: ecu.color, salle: ecu.TDParDefaut, ecu: ecu }) }} />
                    </div>
                )): <div><h1>Aucunes UEs définies</h1></div>}

            </div>
        </div>
    )
}

export default CalendarCoursSelection