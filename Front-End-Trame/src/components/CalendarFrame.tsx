import { useState } from 'react';
import CoursItem from './CoursItem';
import { ECU } from '../types/types';

type CoursFrame = {
    name: string,
    enseignant: string[],
    type: string,
    color: string,
    salle: string,
    ecu: ECU
};

interface CalendarEvent {
    id: number;
    nom: string;
    type: string;
    enseignant: string;
    salle: string;
    jour: number;
    start: number;
    durée: number;
    offset: number;
    couleur: string;
    groupe: string[];
    date: string;
}

function CalendarFrame(props: { currentEcu: CoursFrame | null, setCurrentEcu: (ecu: CoursFrame | null) => void }) {
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const rows = Array.from({ length: 7 }, (_, i) => i + 1);
    const crenaux = [{ 'start': '8h', 'end': '9h30' }, { 'start': '9h45', 'end': '11h15' }, { 'start': '11h30', 'end': '13h' }, { 'start': '13h15', 'end': '14h45' }, { 'start': '15h00', 'end': '16h30' }, { 'start': '16h45', 'end': '18h15' }, { 'start': '18h30', 'end': '20h00' }];
    const [cours, setCours] = useState<CalendarEvent[]>([])
    const creneauHeight = 6;
    const breakHeight = creneauHeight * 15 / 90;

    function AddCours(ecu: CoursFrame, jour: number, start: number) {
        console.log(`ajout de cours ${ecu.name} le ${daysOfWeek[jour]} à ${crenaux[start].start}`)
        if (start === 6 || jour === 5) {
            alert("Etes vous sûr de vouloir vous mettre les élèves à dos?")
            if (!window.confirm("Etes vous sûr de vouloir vous mettre les élèves à dos?")) {
                return;
            }
        }
        setCours([...cours, { 'id': Date.now(), 'nom': ecu.name, 'type': ecu.type, 'enseignant': ecu.enseignant[0], 'salle': ecu.salle, 'jour': jour, 'start': start, 'durée': 1, 'offset': 0, 'couleur': ecu.color, 'groupe': ["2024-L1-A"], date: "2024-11-11" }])

    }

    function RemoveCours(jour: number, start: number) {
        console.log(`suppression de cours le ${daysOfWeek[jour]} à ${crenaux[start].start}`)
        setCours(cours.filter(cours => !(cours.jour === jour && cours.start === start)))
    }

    return (
        <div className="w-[80vw] text-black select-none ">
            <div className="border-2 border-black flex flex-row w-full justify-around rounded-lg ">

                <div key={"horaires"} className="flex flex-col w-20 ">
                    <div className="flex flex-col bg-gray-400 border border-black font-bold h-8">
                    </div>
                    {rows.map((_, colIndex) => (
                        <>
                            <div key={colIndex} className={`bg-gray-400 flex flex-col justify-between border border-black`} style={{ height: `${creneauHeight}rem` }}>
                                <div>{crenaux[colIndex].start} </div>
                                <div>{crenaux[colIndex].end}</div>
                            </div>
                            <div style={{ height: `${breakHeight}rem` }}></div>
                        </>
                    ))}
                </div>
                {daysOfWeek.map((day, index) => (


                    <div key={day} className="flex flex-col flex-grow">
                        <div className="flex flex-col bg-gray-400 border border-black font-bold h-8 ">{`${day}`}</div>
                        {rows.map((_, colIndex) => (
                            <>
                                <div key={colIndex} className="bg-white border border-black hover:bg-gray-300 cursor-pointer relative"
                                    style={{ height: `${creneauHeight}rem` }}
                                    onClick={() => { console.log(`vous avez clické sur ${day} ${crenaux[colIndex].start}`) }}
                                    onMouseUp={() => {
                                        if (props.currentEcu) {
                                            AddCours(props.currentEcu, index, colIndex);
                                        }
                                    }}
                                    onContextMenu={(e) => { e.preventDefault(); console.log(`right click sur ${day} ${crenaux[colIndex].start}`) }} >
                                    {cours.map((cours) => {
                                        if (cours.jour === index && cours.start === colIndex) {
                                            return (
                                                <CoursItem cours={cours} onMouseDown={(e) => {
                                                    if (e.button === 0) { // Only listen to left click
                                                        props.setCurrentEcu({
                                                            name: cours.nom, enseignant: [cours.enseignant], type: cours.type, color: cours.couleur, salle: cours.salle, ecu: {
                                                                name: cours.nom,
                                                                numberOfCM: 0,
                                                                numberOfTD: 0,
                                                                enseignantCM: cours.enseignant,
                                                                enseignantTD: [cours.enseignant],
                                                                color: cours.couleur,
                                                                AmphiParDefaut: cours.salle,
                                                                TDParDefaut: cours.salle
                                                            }
                                                        });
                                                        RemoveCours(index, colIndex);
                                                    }
                                                }} />
                                            )
                                        }
                                    })}
                                </div>
                                <div style={{ height: `${breakHeight}rem` }}></div>
                            </>
                        ))}
                    </div>

                ))}
            </div>
        </div>
    );

}

export default CalendarFrame