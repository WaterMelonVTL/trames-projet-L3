import React, { useEffect, useRef } from 'react';
import { Cours } from '../types/types';
import Portal from './Portal';

function CalendarOptionMenu(props: { cours: Cours, setCours: (cours: Cours) => void, close: () => void, position: { top: number, left: number } }) {
    const menuRef = useRef<HTMLDivElement>(null);
    const startTimes = [8, 9.75, 11.5, 13.25, 15, 16.75, 18.5]; // get from the server

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                props.close();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuRef, props]);

    function editCours(newDuration?: number, newOffset?: number, newSalle?: string) {
        if (!props.cours) {
            return;
        }
        if (newDuration !== undefined) {
            props.setCours({ ...props.cours, durée: newDuration });
        }
        if (newOffset !== undefined) {
            props.setCours({ ...props.cours, offset: newOffset });
        }
        if (newSalle !== undefined) {
            props.setCours({ ...props.cours, salle: newSalle });
        }
        console.log(`vous avez modifié ${props.cours.nom} ${props.cours.date} ${props.cours.couleur}`);
    }

    const dureeToHoursAndMinutes = (duree: number) => {
        const minutes = Math.round(duree * 90);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h${remainingMinutes}`;
    };

    const offsetToMinutes = (offset: number) => {
        const minutes = Math.round(offset * 60);
        return `${minutes}mn`;
    };

    const getFormattedTimeSpan = () => {
        const start = startTimes[props.cours.start] * 60 + props.cours.offset * 60;
        const end = start + props.cours.durée * 90;
        return `${dureeToHoursAndMinutes(start / 90)} - ${dureeToHoursAndMinutes(end / 90)}`;
    };

    return (
        <Portal>
            <div
                ref={menuRef}
                className='fixed bg-white shadow-lg shadow-gray-400 rounded-md border-2 border-black w-72 z-[5000] cursor-default'
                style={{ top: props.position.top, left: props.position.left }}
            >
                <div className='flex flex-col items-center'>
                    <h1 className='text-xl font-bold mt-4'>Modifier le cours</h1>
                    <h1 className='font-bold my-4'>{getFormattedTimeSpan()}</h1>
                    <div className='flex flex-col items-center mb-4'>

                        <h1 className='text-lg font-semibold mb-2'>Durée du cours</h1>
                        <div className='flex space-x-2 '>
                            <button className='border-2 border-black px-2 rounded-md bg-slate-200 text-black hover:bg-slate-500 hover:text-white transition-all hover:scale-105 duration-300 font-bold h-8 w-18' onClick={() => editCours(props.cours.durée - 0.166666666667)}>-15mn</button>
                            <h1>{dureeToHoursAndMinutes(props.cours.durée)}</h1>
                            <button className='border-2 border-black px-2 rounded-md bg-slate-200 text-black hover:bg-slate-500 hover:text-white transition-all hover:scale-105 duration-300 font-bold h-8 w-18' onClick={() => editCours(props.cours.durée + 0.166666666667)}>+15mn</button>
                        </div>
                    </div>
                    <div className='flex flex-col items-center mb-4'>
                        <h1 className='text-lg font-semibold mb-2'>Décalage du cours</h1>
                        <div className='flex space-x-2'>
                            <button className='border-2 border-black px-2 rounded-md bg-slate-200 text-black hover:bg-slate-500 hover:text-white transition-all hover:scale-105 duration-300 font-bold h-8 w-18' onClick={() => editCours(undefined, props.cours.offset - 0.25)}>-15mn</button>
                            <h1>{offsetToMinutes(props.cours.offset)}</h1>
                            <button className='border-2 border-black px-2 rounded-md bg-slate-200 text-black hover:bg-slate-500 hover:text-white transition-all hover:scale-105 duration-300 font-bold h-8 w-18' onClick={() => editCours(undefined, props.cours.offset + 0.25)}>+15mn</button>
                        </div>
                    </div>
                    <div className='flex flex-col items-center mb-4'>
                        <h1 className='text-lg font-semibold mb-2'>Salle du cours</h1>
                        <input type="text" className='border-2 border-black w-16' placeholder={props.cours.salle} onChange={(e) => editCours(undefined, undefined, e.target.value)} />
                    </div>
                </div>
            </div>
        </Portal>
    );
}

export default CalendarOptionMenu;