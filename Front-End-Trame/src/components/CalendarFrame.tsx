import { useState } from 'react';
import React from 'react'
import CoursItem from './CoursItem';

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

function CalendarFrame(props: { currentEcu: CoursFrame | null }) {
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const rows = Array.from({ length: 7 }, (_, i) => i + 1);
    const crenaux = [{'start': '8h', 'end':'9h30'}, {'start': '9h45', 'end':'11h15'}, {'start': '11h30', 'end':'13h'}, {'start': '13h30', 'end':'15h'}, {'start': '15h15', 'end':'16h45'}, {'start': '17h', 'end':'18h30'}, {'start': '18h45', 'end':'20h15'}];
    const [cours, setCours] = useState([{'id':123, 'nom': 'HAI101I', 'type': 'CM', 'enseignant': 'M. Dupont', 'salle': 'A5.01', 'jour':1, 'start':1 , 'durée':1, 'offset':0, 'couleur':'#FFB3BA', 'groupe':["2024-L1-A","2024-L1-B","2024-L1-C"], date:"2024-11-11"}, 
        {'id':124, 'nom': 'HAI101I', 'type': 'TD', 'enseignant': 'M. Dupont', 'salle': '36.206', 'jour':1, 'start':2 , 'durée':1, 'offset':0, 'couleur':'#FFB3BA', 'groupe':["2024-L1-A"], date:"2024-11-11"}, 
        {'id':125, 'nom': 'HAI101I', 'type': 'TP', 'enseignant': 'M. Dupont', 'salle': '36.206', 'jour':1, 'start':3 , 'durée':1, 'offset':0, 'couleur':'#FFB3BA', 'groupe':["2024-L1-A"], date:"2024-11-11"} ])

    function AddCours(ecu: CoursFrame, jour: number, start: number) {
        console.log(`ajout de cours ${ecu.name} le ${daysOfWeek[jour]} à ${crenaux[start].start}`)
        setCours([...cours, {'id': Date.now(), 'nom': ecu.name, 'type': ecu.type, 'enseignant': ecu.enseignant[0], 'salle': ecu.salle, 'jour': jour, 'start': start, 'durée': 1, 'offset': 0, 'couleur': ecu.color, 'groupe': ["2024-L1-A"], date: "2024-11-11"}])
    }
    
    return (
        <div className="w-[80vw] text-black">
            <div className="border-2 border-black flex flex-row w-full justify-around rounded-lg">
                <div key={"horaires"} className="flex flex-col w-20">
                    <div className="flex flex-col">{`Crenaux`}</div>
                    {rows.map((_, colIndex) => (
                        <>
                            <div key={colIndex} className="bg-gray-400 h-28 flex flex-col justify-between border border-black">
                                <div>{crenaux[colIndex].start} </div>
                                <div>{crenaux[colIndex].end}</div>
                            </div>
                            <div className="h-3"></div>
                        </>
                    ))}
                </div>
                {daysOfWeek.map((day, index) => (


                    <div key={day} className="flex flex-col flex-grow">
                        <div className="flex flex-col bg-gray-400 border border-black font-bold">{`${day}`}</div>
                        {rows.map((_, colIndex) => (
                            <>
                                <div key={colIndex} className="bg-white h-28 border border-black hover:bg-gray-300 cursor-pointer relative" 
                                onClick={()=> {console.log(`vous avez clické sur ${day} ${crenaux[colIndex].start}`)}} 
                                onMouseUp={() => {
                                    if (props.currenEcu) {
                                        AddCours(props.currenEcu, index, colIndex);
                                    }
                                }}
                                onContextMenu={(e) => {e.preventDefault(); console.log(`right click sur ${day} ${crenaux[colIndex].start}`)}} >
                                    {cours.map((cours) => {
                                        if (cours.jour === index && cours.start === colIndex) {
                                            return (
                                                <CoursItem cours={cours} />
                                            )
                                        }
                                    })}
                                </div>
                                <div className="h-3"></div>
                            </>
                        ))}
                    </div>

                ))}
            </div>
        </div>
    );

}

export default CalendarFrame