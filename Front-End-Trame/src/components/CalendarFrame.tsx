import { useEffect, useState } from 'react';
import CoursItem from './CoursItem';
import { Course } from '../types/types';
import {api} from '../public/api/api.js'; // ensure your api module is imported

interface CalendarFrameProps {
    date: Date;
    fetchedCourse: Course[];
    currentCours: Course | null;
    setCours: (ecu: Course[] | null) => void;
    setCurrentCours: (ecu: Course | null) => void;
    trammeId: string | undefined;
    AddCours: (cours: Course, date: string, time: string) => void;
    color: string;
    setPoolRefreshCounter: React.Dispatch<React.SetStateAction<number>>;
    onDeleteCourse?: (courseId: number | string, date: string, forMoving?: boolean) => void;
}

function CalendarFrame({
    date,
    fetchedCourse,
    currentCours,
    setCours,
    setCurrentCours,
    trammeId,
    AddCours,
    color,
    setPoolRefreshCounter,
    onDeleteCourse
}: CalendarFrameProps) {
    const [designatedDays, setDesignatedDays] = useState<{ [key: string]: boolean }>({});
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']; // Add samedi if you want to display it
    const rows = Array.from({ length: 7 }, (_, i) => i + 1);
    const crenaux = [{ 'start': '8h', 'end': '9h30' }, { 'start': '9h45', 'end': '11h15' }, { 'start': '11h30', 'end': '13h' }, { 'start': '13h15', 'end': '14h45' }, { 'start': '15h00', 'end': '16h30' }, { 'start': '16h45', 'end': '18h15' }, { 'start': '18h30', 'end': '20h00' }];
    const creneauHeight = 6;
    const breakHeight = creneauHeight * 15 / 90;

    const defaultDate = date;

    useEffect(() => {
        // On date or trammeId change, check designated days for each displayed day
        if (!trammeId) return;
        daysOfWeek.forEach((_, index) => {
            const currentDate = getDateForDay(index);
            const dateKey = currentDate.toISOString().split('T')[0];
            api.get(`/trammes/is-dts/${trammeId}/${dateKey}`)
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
    }, [date, trammeId]);

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

    function RemoveCours(id: number | string, forMoving: boolean = true) {
        if (onDeleteCourse && id) {
            // Find the course in the fetched courses
            const course = fetchedCourse.find(c => String(c.Id) === String(id));
            
            console.log(`Attempting to remove course ${id}, found in fetched courses: ${!!course}`);
            
            if (course) {
                // Success path - we found the course
                console.log(`Removing course ${id} for ${forMoving ? 'moving' : 'deletion'}`);
                onDeleteCourse(id, course.Date, forMoving);
            } else {
                console.error(`Course ${id} not found in fetchedCourse array of length ${fetchedCourse.length}`);
                console.log("Available course IDs:", fetchedCourse.map(c => `${c.Id} (${typeof c.Id})`).join(", "));
                
                // IMPROVED FALLBACK: Use current date from the UI calendar
                let fallbackDate;
                
                // Try to get a sensible date from the current UI view
                if (defaultDate) {
                    fallbackDate = defaultDate.toISOString().split('T')[0];
                    console.log(`Using calendar default date for fallback: ${fallbackDate}`);
                } else {
                    // Last resort - use current date
                    fallbackDate = new Date().toISOString().split('T')[0];
                    console.log(`Using today's date for fallback: ${fallbackDate}`);
                }
                
                // Try deletion with the fallback date
                onDeleteCourse(id, fallbackDate, forMoving);
            }
        }
    }

    // Use this for regular deletions (right-click menu, etc.)
    const handleDelete = (courseId: number | string, date: string) => {
        if (onDeleteCourse) {
            console.log(`Handling regular delete for course ${courseId}`);
            // Pass false to indicate this is a regular deletion, not a move
            onDeleteCourse(courseId, date, false);
        }
    };

    return (
        <div className="w-[80vw] text-black select-none ">
            <div className="border-2 border-black flex flex-row w-full justify-around rounded-lg rounded-tl-none">

                <div key={"horaires"} className="flex flex-col w-20 ">
                    <div className="flex flex-col  border border-black font-bold h-12"
                        style={{ backgroundColor: color }}>
                    </div>
                    {rows.map((_, colIndex) => (
                        <>
                            <div key={colIndex} className={` flex flex-col justify-between border border-black`} style={{
                                height: `${creneauHeight}rem`,
                                backgroundColor: color
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
                            <div className="flex flex-col border border-black font-bold h-12" style={{ backgroundColor: isDesignated ? 'lightgray' : color, minHeight: '2rem' }}>
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
                                            if (currentCours) {
                                                AddCours(currentCours, currentDate.toISOString(), formatTime(crenaux[colIndex].start));
                                            }
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            console.log(`right click sur ${day} ${crenaux[colIndex].start}`);
                                        }}
                                    >
                                        {fetchedCourse.map((cours) => {
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
                                                        setCours={setCours}
                                                        trammeId={trammeId}
                                                        créneau={crenaux[colIndex]}
                                                        onMouseDown={(e) => {
                                                            if (e.button === 0) {
                                                                console.log("Dragging course:", cours);
                                                                
                                                                // Ensure course ID is treated consistently
                                                                const courseId = cours.Id;
                                                                if (!courseId) {
                                                                    console.error("Attempted to move/delete course with undefined ID");
                                                                    return;
                                                                }
                                                                
                                                                // Set the current course first before deletion
                                                                setCurrentCours({...cours});
                                                                
                                                                // Small delay to ensure the current course is set before deletion
                                                                setTimeout(() => {
                                                                    RemoveCours(courseId, true);
                                                                }, 10);
                                                            }
                                                        }}
                                                        onContextMenu={(e) => {
                                                            e.preventDefault();
                                                            // Context menu handling logic would go here
                                                            // This would typically open a menu with options like delete, separate, merge
                                                            console.log(`Context menu opened for course: ${cours.Id}`);
                                                            // Call RemoveCours with forMoving=false for actual deletion
                                                            if (e.shiftKey) {
                                                                handleDelete(cours.Id, cours.Date);
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