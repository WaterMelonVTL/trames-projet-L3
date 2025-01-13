import { useEffect, useState } from 'react';
import CoursItem from './CoursItem';
import { Course } from '../types/types';



function CalendarFrame(props: { currentCours: Course | null, setCurrentEcu: (ecu: Course | null) => void, AddCours: (cours: Course, date: string, time: string) => void }) {
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const rows = Array.from({ length: 7 }, (_, i) => i + 1);
    const crenaux = [{ 'start': '8h', 'end': '9h30' }, { 'start': '9h45', 'end': '11h15' }, { 'start': '11h30', 'end': '13h' }, { 'start': '13h15', 'end': '14h45' }, { 'start': '15h00', 'end': '16h30' }, { 'start': '16h45', 'end': '18h15' }, { 'start': '18h30', 'end': '20h00' }];
    const [cours, setCours] = useState<Course[]>([])
    const creneauHeight = 6;
    const breakHeight = creneauHeight * 15 / 90;


    const [defaultDate, setDefaultDate] = useState<Date>(new Date('2001-01-01')); // Starting date



    function getDateForDay(jour: number): string {
        const date = new Date(defaultDate);
        date.setDate(defaultDate.getDate() + jour);
        return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }

    function formatTime(start: string): string {
        const [hour, minute] = start.split('h').map(Number);
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    }

    function isTimeInCreneau(time: string, start: string, end: string): boolean {
        const timeDate = new Date(`1970-01-01T${time}:00`);
        const startDate = new Date(`1970-01-01T${formatTime(start)}:00`);
        const endDate = new Date(`1970-01-01T${formatTime(end)}:00`);
        return timeDate >= startDate && timeDate < endDate;
    }



    useEffect(() => {
        fetch('http://localhost:3000/api/cours')
            .then(response => response.json())
            .then(data => setCours(data))
            .catch(error => {
                console.error('Error:', error);
            });
    }, []);

    function RemoveCours(id: number) {
        fetch(`http://localhost:3000/api/cours/${id}`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    setCours(cours.filter((cours) => cours.Id !== id));
                } else {
                    console.error('Failed to delete the course');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function getMonday(date: Date): Date {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
        return new Date(date.setDate(diff));
    }

    async function fetchClassesForWeek(monday: Date) {
        const classes = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const response = await fetch(`http://localhost:3000/api/classes?date=${date.toISOString().split('T')[0]}`);
            const dayClasses = await response.json();
            classes.push(dayClasses);
        }
        return classes;
    }

    useEffect(() => {
        fetchClassesForWeek(getMonday(new Date())).then(classes => {
            setCours(classes.flat());
            console.log(classes);
        });
    }, []);

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
                {daysOfWeek.map((day, index) => {
                    const currentDate = getDateForDay(index); // Get the date for the current day index

                    return (
                        <div key={day} className="flex flex-col flex-grow">
                            <div className="flex flex-col bg-gray-400 border border-black font-bold h-8 ">{`${day}`}</div>
                            {rows.map((_, colIndex) => (
                                <>
                                    <div
                                        key={colIndex}
                                        className="bg-white border border-black hover:bg-gray-300 cursor-pointer relative"
                                        style={{ height: `${creneauHeight}rem` }}
                                        onClick={() => {
                                            console.log(`vous avez clické sur ${day} ${crenaux[colIndex].start}`);
                                        }}
                                        onMouseUp={() => {
                                            if (props.currentCours) {
                                                props.AddCours(props.currentCours, getDateForDay(index), formatTime(crenaux[colIndex].start));
                                            }
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            console.log(`right click sur ${day} ${crenaux[colIndex].start}`);
                                        }}
                                    >
                                        {cours.map((cours) => {
                                            const courseDate = new Date(cours.Date); // Convert string to Date object
                                            const courseStartTime = formatTime(cours.StartHour);

                                            if (
                                                courseDate.toDateString() === currentDate &&
                                                isTimeInCreneau(courseStartTime, crenaux[colIndex].start, crenaux[colIndex].end)
                                            ) {
                                                return (
                                                    <CoursItem
                                                        key={cours.Id}
                                                        cours={cours}
                                                        onMouseDown={(e) => {
                                                            if (e.button === 0) {
                                                                // Only listen to left click
                                                                props.setCurrentEcu(cours);
                                                                RemoveCours(cours.Id);
                                                            }
                                                        }}
                                                    />
                                                );
                                            }
                                        })}
                                    </div>
                                    <div style={{ height: `${breakHeight}rem` }}></div>
                                </>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );

}

export default CalendarFrame