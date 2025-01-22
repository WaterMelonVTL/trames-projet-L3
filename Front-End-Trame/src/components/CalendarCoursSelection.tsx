import { useState, useEffect } from 'react';
import EcuItem from './EcuItem';
import { UE, Course } from '../types/types';

function CalendarCoursSelection(props: { setCurrentEcu: (ecu: Course | null) => void, ecus: UE[] }) {

    const [hoveredItem, setHoveredItem] = useState<number>(-1);
    const [isSearching, setIsSearching] = useState<string>("");
    const [filteredList, setFilteredList] = useState<UE[]>(props.ecus);

    useEffect(() => {
        if (isSearching === "") {
            setFilteredList(props.ecus);
        } else {
            setFilteredList(props.ecus.filter(ecu => ecu.Name.toLowerCase().includes(isSearching.toLowerCase())));
        }
    }, [props.ecus, isSearching]);

    const search = (search: string) => {
        setIsSearching(search);
    };

    return (
        <div className='self-start '>
            <h1 className='font-bold text-xl mb-4 '>Cours disponibles :</h1>
            <div className='min-h-20 w-[18vw] rounded-lg border-2 border-black text-xl p-2 text-black flex flex-col items-center max-h-[80vh] overflow-y-auto py-4 relative shadow-inner shadow-gray-300'>
                <div className='rounded-full absolute shadow-lg h-10 w-[95%] flex text-base font-normal bg-white border-2 border-gray-800'>
                    <input
                        type="text"
                        placeholder='Un cours en particulier?'
                        className='m-auto h-8 w-[90%] focus:outline-none'
                        value={isSearching}
                        onChange={(e) => search(e.target.value)}
                    />
                </div>
                <div className='mt-16 z-50 max-h-[45rem] overflow-y-auto w-full'>
                    {filteredList?.length > 0 ? (
                        filteredList.map((ecu, index) => (
                            <div key={ecu.Id} className='flex flex-col flex-gap-2 mb-4 w-full items-center'>
                                <EcuItem
                                    darken={hoveredItem !== -1 && hoveredItem !== index}
                                    type="CM"
                                    ueID={ecu.Id}
                                    onHover={() => setHoveredItem(index)}
                                    onLeave={() => setHoveredItem(-1)}
                                    setHoveredItem={setHoveredItem}
                                    setCurrentEcu={props.setCurrentEcu}
                                />
                                <EcuItem
                                    darken={hoveredItem !== -1 && hoveredItem !== index + props.ecus.length}
                                    type="TD"
                                    ueID={ecu.Id}
                                    onHover={() => setHoveredItem(index + props.ecus.length)}
                                    onLeave={() => setHoveredItem(-1)}
                                    setHoveredItem={setHoveredItem}
                                    setCurrentEcu={props.setCurrentEcu}
                                />
                            </div>
                        ))
                    ) : (
                        <div><h1>Aucunes UEs définies</h1></div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CalendarCoursSelection;
