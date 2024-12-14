import React from 'react'

function CalendarFrame() {
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const rows = Array.from({ length: 7 }, (_, i) => i + 1);
    const crenaux = [{'start': '8h', 'end':'9h30'}, {'start': '9h45', 'end':'11h15'}, {'start': '11h30', 'end':'13h'}, {'start': '13h30', 'end':'15h'}, {'start': '15h15', 'end':'16h45'}, {'start': '17h', 'end':'18h30'}, {'start': '18h45', 'end':'20h15'}];
    return (
        <div className="w-[80vw] text-black">
            <div className="border-2 border-black flex flex-row w-full justify-around">
                <div key={"horaires"} className="flex flex-col w-20">
                    <div className="flex flex-col">{`Crenaux`}</div>
                    {rows.map((_, colIndex) => (
                        <>
                            <div key={colIndex} className="bg-gray-400 h-28 flex flex-col justify-between border border-black">
                                <div>{crenaux[colIndex].start} </div>
                                <div>{crenaux[colIndex].end}</div>
                            </div>
                            <div className="my-1 "></div>
                        </>
                    ))}
                </div>
                {daysOfWeek.map(day => (


                    <div key={day} className="flex flex-col flex-grow">
                        <div className="flex flex-col bg-gray-400 border border-black">{`${day}`}</div>
                        {rows.map((_, colIndex) => (
                            <>
                                <div key={colIndex} className="bg-white h-28 border border-black hover:bg-gray-300 cursor-pointer" onClick={()=> {console.log(`vous avez clické sur ${day} ${crenaux[colIndex].start}`)}} onContextMenu={(e) => {e.preventDefault(); console.log(`right click sur ${day} ${crenaux[colIndex].start}`)}} >{`${day} ${crenaux[colIndex].start}`}</div>
                                <div className="my-1 "></div>
                            </>
                        ))}
                    </div>

                ))}
            </div>
        </div>
    );

}

export default CalendarFrame