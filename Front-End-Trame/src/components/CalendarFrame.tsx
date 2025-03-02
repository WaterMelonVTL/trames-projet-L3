import { useEffect, useState } from 'react';
import CoursItem from './CoursItem';
import { Course } from '../types/types';
import {api} from '../public/api/api.js'; // ensure your api module is imported

function CalendarFrame(props: { date: Date, fetchedCourse: Course[], currentCours: Course | null, setCours: (ecu: Course[] | null) => void, setCurrentCours: (ecu: Course | null) => void, trammeId: string | undefined, AddCours: (cours: Course, date: string, time: string) => void, color: string, setPoolRefreshCounter: React.Dispatch<React.SetStateAction<number>> }) {
    const [designatedDays, setDesignatedDays] = useState<{ [key: string]: boolean }>({});
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']; // Add samedi if you want to display it
    const rows = Array.from({ length: 7 }, (_, i) => i + 1);
    const crenaux = [{ 'start': '8h', 'end': '9h30' }, { 'start': '9h45', 'end': '11h15' }, { 'start': '11h30', 'end': '13h' }, { 'start': '13h15', 'end': '14h45' }, { 'start': '15h00', 'end': '16h30' }, { 'start': '16h45', 'end': '18h15' }, { 'start': '18h30', 'end': '20h00' }];
    const creneauHeight = 6;
    const breakHeight = creneauHeight * 15 / 90;

    const defaultDate = props.date;

    useEffect(() => {
        // On props.date or props.trammeId change, check designated days for each displayed day
        if (!props.trammeId) return;
        daysOfWeek.forEach((_, index) => {
            const currentDate = getDateForDay(index);
            const dateKey = currentDate.toISOString().split('T')[0];
            api.get(`/trammes/is-dts/${props.trammeId}/${dateKey}`)
                .then(() => {
                    console.log("dateKey", dateKey);
                    setDesignatedDays(prev => ({ ...prev, [dateKey]: true }));
                })
                .catch(() => {
                    // Do nothing on error
                });
        });
        console.log("designatedDays", designatedDays);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.date, props.trammeId]);

    function getDateForDay(jour: number): Date {
        const date = new Date(defaultDate);
        date.setDate(defaultDate.getDate() + jour);
        return date; // Format as YYYY-MM-DD
    }

    function formatTime(start: string): string {
        const [hour, minute] = start.split('h').map(Number);
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    }

    function isTimeInCreneau(time: string, start: string, end: string): boolean {

        const timeDate = new Date(`1970-01-01T${time}`);
        const startDate = new Date(`1970-01-01T${formatTime(start)}`);
        const endDate = new Date(`1970-01-01T${formatTime(end)}`);
        return timeDate >= startDate && timeDate < endDate;
    }

    function sameDay(d1: Date, d2: Date): boolean {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

    function RemoveCours(id: number) {
        fetch(`http://localhost:3000/api/cours/${id}`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    props.setCours(props.fetchedCourse.filter((cours) => cours.Id !== id));
                    props.setPoolRefreshCounter(prev => prev + 1);

                } else {
                    console.error('Failed to delete the course');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    useEffect(() => {
        console.log("cours from jsp ou:", props.fetchedCourse);
    }, [props.fetchedCourse]);

    return (
        <div className="w-[80vw] text-black select-none ">
            <div className="border-2 border-black flex flex-row w-full justify-around rounded-lg rounded-tl-none">

                <div key={"horaires"} className="flex flex-col w-20 ">
                    <div className="flex flex-col  border border-black font-bold h-12"
                        style={{ backgroundColor: props.color }}>
                    </div>
                    {rows.map((_, colIndex) => (
                        <>
                            <div key={colIndex} className={` flex flex-col justify-between border border-black`} style={{
                                height: `${creneauHeight}rem`,
                                backgroundColor: props.color
                            }}>
                                <div>{crenaux[colIndex].start} </div>
                                <div>{crenaux[colIndex].end}</div>
                            </div>
                            <div style={{ height: `${breakHeight}rem` }}></div>
                        </>
                    ))}
                </div>
                {daysOfWeek.map((day, index) => {
                    const currentDate = getDateForDay(index); // Get the date for the current day index
                    const dateKey = currentDate.toISOString().split('T')[0];
                    const isDesignated = designatedDays[dateKey] || false;

                    return (
                        <div key={day} className="flex flex-col flex-grow">
                            {/* Updated header: show "type" if year is 2001, else display the formatted date */}
                            <div className="flex flex-col border border-black font-bold h-12" style={{ backgroundColor: isDesignated ? 'lightgray' : props.color, minHeight: '2rem' }}>
                                <div>{day}</div>
                                {currentDate.getFullYear() === 2001 ? (
                                    <div className="text-xs">type</div>
                                ) : (
                                    <div className="text-xs">{currentDate.toISOString().split('T')[0]}</div>
                                )}
                            </div>
                            {rows.map((_, colIndex) => (
                                <>
                                    <div
                                        key={colIndex}
                                        className=" border border-black hover:bg-gray-300 cursor-pointer relative bg-white flex"
                                        style={{ 
                                            height: `${creneauHeight}rem`,
                                            background: isDesignated ? 'repeating-linear-gradient(45deg, #d3d3d3, #d3d3d3 10px, #fff 10px, #fff 20px)' : 'white'
                                        }}
                                        onClick={() => {
                                            console.log(`vous avez clické sur ${day} ${crenaux[colIndex].start}`);
                                        }}
                                        onMouseUp={() => {
                                            if (props.currentCours) {
                                                props.AddCours(props.currentCours, currentDate.toISOString(), formatTime(crenaux[colIndex].start));
                                            }
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            console.log(`right click sur ${day} ${crenaux[colIndex].start}`);
                                        }}
                                    >
                                        {props.fetchedCourse.map((cours) => {
                                            const courseDate = new Date(cours.Date); // Convert string to Date object
                                            const courseStartTime = cours.StartHour;
                                            // Compare using local date parts
                                            if (!sameDay(courseDate, currentDate)) {
                                                return null;
                                            }
                                            if (
                                                isTimeInCreneau(courseStartTime, crenaux[colIndex].start, crenaux[colIndex].end)
                                            ) {

                                                return (
                                                    <><CoursItem
                                                        key={cours.Id.toString()}
                                                        cours={cours}
                                                        setCours={props.setCours}

                                                        créneau={crenaux[colIndex]}
                                                        onMouseDown={(e) => {
                                                            if (e.button === 0) {
                                                                props.setCurrentCours(cours);
                                                                console.log("cours:", cours);
                                                                RemoveCours(cours.Id);
                                                            }
                                                        }}
                                                    />

                                                    </>
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