import React, { useEffect, useRef, useState } from 'react';
import { Course } from '../types/types';
import Portal from './Portal';
import {api} from '../public/api/api.js';
interface CalendarOptionMenuProps {
    cours: Course;
    setCours: React.Dispatch<React.SetStateAction<Course[]>>;
    close: () => void;
    position: { top: number, left: number };
}

function CalendarOptionMenu(props: CalendarOptionMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const startTimes = [8, 9.75, 11.5, 13.25, 15, 16.75, 18.5];

    // New state variables for the Professeur section
    const [teacherName, setTeacherName] = useState('');
    const [teacherStatus, setTeacherStatus] = useState('Permanent');

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

    // Helper functions to parse/format time (HH:mm)
    const parseTime = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const formatTime = (totalMinutes: number): string => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const getFormattedTimeSpan = (): string => {
        const start = parseTime(props.cours.StartHour);
        const end = start + Math.round(props.cours.length * 60);
        return `${formatTime(start)} - ${formatTime(end)}`;
    };

    async function editCours({ newLength, newStart }: { newLength?: number, newStart?: string }) {
        if (!props.cours) return;
        const updatedCourse = {
            ...props.cours,
            ...(newLength !== undefined && { length: newLength }),
            ...(newStart !== undefined && { StartHour: newStart })
        };
        try {
            const response = await fetch(`http://localhost:3000/api/cours/${props.cours.Id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course: updatedCourse })
            });
            if (!response.ok) throw new Error('Update failed');
            const data = await response.json();
            props.setCours(data);
            console.log(`Modified course ${props.cours.Id}: new length ${newLength ?? props.cours.length}, new start ${newStart ?? props.cours.StartHour}`);
        } catch (error) {
            console.error(error);
        }
    }

    // Handler for adding a professor (placeholder)
    const addTeacher = () => {
        console.log(`Add teacher: ${teacherName} - ${teacherStatus}`);
        // Reset fields
        setTeacherName('');
        setTeacherStatus('Permanent');
    };

    const Separate = async (id: number) => {
        try {
            const newCourses = await api.post('/cours/separate/' + id);
            props.setCours((prev: Course[]) => [
                ...prev.filter(c => c.Id !== id),
                ...newCourses,
            ]);
            console.log('Separated courses:', newCourses);
        } catch (error) {
            console.error('Failed to separate courses:', error);
        }
    };

    const Merge = async (id: number) => {
        try {
            const mergedCourse = await api.post('/cours/merge/' + id);
            console.log("Merge: props.setCours =", props.setCours);
            if (typeof props.setCours !== 'function') {
                throw new Error('setCours is not a function');
            }
            props.setCours((prev: Course[]) => [
                ...prev.filter(c =>
                    !(c.UEId === mergedCourse.UEId &&
                      c.Date === mergedCourse.Date &&
                      c.StartHour === mergedCourse.StartHour)
                ),
                mergedCourse,
            ]);
            console.log('Merged course:', mergedCourse);
        } catch (error) {
            console.error('Failed to merge courses:', error);
        }
    };



    return (
        <Portal>
            <div
                ref={menuRef}
                className="fixed bg-white rounded-lg shadow-2xl p-6  z-[5000] cursor-default border-2 border-gray-800 translate-x-2 translate-y-2"
                style={{ top: props.position.top, left: props.position.left }}
            >
                <h1 className="text-2xl font-semibold text-gray-800 text-center  border-b pb-2">Modifier le cours</h1>
                <h1 className='text-xl font-semibold text-gray-800 text-center mb-4 border-b pb-2'>{getFormattedTimeSpan()}</h1>
                <div className="flex flex-row gap-4">

                    {/* Temporalité Section */}
                    <div className="flex flex-col border p-3 rounded-md w-1/3">
                        <h2 className="text-lg font-semibold text-gray-700 text-center mb-2">Temporalité</h2>

                        {/* Duration Subsection */}
                        <div className="mb-4 border-b pb-2">
                            <h3 className="text-base font-semibold text-gray-700">Durée</h3>
                            <div className="flex justify-between items-center mt-1">
                                <button
                                    className="px-2 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition"
                                    onClick={() => editCours({ newLength: props.cours.length - 0.25 })}
                                >-15mn</button>
                                <span className="font-medium text-gray-800">{props.cours.length.toFixed(2)} h</span>
                                <button
                                    className="px-2 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition"
                                    onClick={() => editCours({ newLength: props.cours.length + 0.25 })}
                                >+15mn</button>
                            </div>
                        </div>

                        {/* Start Time Subsection */}
                        <div>
                            <h3 className="text-base font-semibold text-gray-700">Heure de début</h3>
                            <div className="flex justify-between items-center mt-1">
                                <button
                                    className="px-2 py-1 rounded-md bg-green-500 text-white hover:bg-green-600 transition"
                                    onClick={() => {
                                        const newTime = parseTime(props.cours.StartHour) - 15;
                                        editCours({ newStart: formatTime(newTime) });
                                    }}
                                >-15mn</button>
                                <span className="font-medium text-gray-800 mx-2">{props.cours.StartHour}</span>
                                <button
                                    className="px-2 py-1 rounded-md bg-green-500 text-white hover:bg-green-600 transition"
                                    onClick={() => {
                                        const newTime = parseTime(props.cours.StartHour) + 15;
                                        editCours({ newStart: formatTime(newTime) });
                                    }}
                                >+15mn</button>
                            </div>
                        </div>
                    </div>

                    {/* Professeur Section */}
                    <div className="flex flex-col border p-3 rounded-md w-1/3">
                        <h2 className="text-lg font-semibold text-gray-700 text-center mb-2">Professeur</h2>
                        <div className="flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder="Nom du professeur"
                                value={teacherName}
                                onChange={(e) => setTeacherName(e.target.value)}
                                className="border p-1 rounded-md"
                            />
                            <select
                                value={teacherStatus}
                                onChange={(e) => setTeacherStatus(e.target.value)}
                                className="border p-1 rounded-md"
                            >
                                <option value="Permanent">Permanent</option>
                                <option value="Temporaire">Temporaire</option>
                                <option value="doctorant">doctorant</option>
                            </select>
                            <button
                                className="w-full py-1 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition"
                                onClick={addTeacher}
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>

                    {/* Avancé Section */}
                    <div className="flex flex-col border p-3 rounded-md w-1/3">
                        <h2 className="text-lg font-semibold text-gray-700 text-center mb-2">Avancé</h2>
                        <div className="flex flex-col gap-3">
                            <button
                                className="w-full py-2 rounded-md bg-purple-500 text-white hover:bg-purple-600 transition"
                                onClick={() => Separate(props.cours.Id)}
                            >
                                Séparer par groupes
                            </button>
                            <button
                                className="w-full py-2 rounded-md bg-purple-500 text-white hover:bg-purple-600 transition"
                                onClick={() => Merge(props.cours.Id)}
                            >
                                Regrouper
                            </button>
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-gray-600 italic">Pour les masters :</span>

                                <button
                                    className="w-full py-2 rounded-md mb-2 bg-purple-500 text-white hover:bg-purple-600 transition"
                                    onClick={() => console.log('Lier à un autre layer not implemented yet')}
                                >
                                    Lier à un autre layer
                                </button>
                                <button
                                    className="w-full py-2 rounded-md bg-purple-500 text-white hover:bg-purple-600 transition"
                                    onClick={() => console.log('Lier à un autre layer not implemented yet')}
                                >
                                    Groupe attitré
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
}

export default CalendarOptionMenu;