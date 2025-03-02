import { useState, useEffect } from 'react';
import EcuItem from './EcuItem';
import { CoursePool, Course } from '../types/types';
import { api } from '../public/api/api.js';
import PoolItem from './PoolItem';

function CalendarCoursSelection(props: { setCurrentCours: (UE: Course | null) => void, layerId: number }) {

    const [hoveredItem, setHoveredItem] = useState<number>(-1);
    const [isSearching, setIsSearching] = useState<string>("");

    const [coursePool, setCoursePool] = useState<CoursePool[]>([]);

    const [filteredList, setFilteredList] = useState<CoursePool[]>(coursePool);

    useEffect(() => {
        if (isSearching === "") {
            setFilteredList(coursePool);
        } else {
            setFilteredList(coursePool.filter(poolItem => poolItem.UE.Name.toLowerCase().includes(isSearching.toLowerCase())));
        }
    }, [coursePool, isSearching]);
    const fetchCoursePool = async (layerId:number) => {
        try {
            const coursepool = await api.get('/ues/remainingpool/' + layerId)
            setCoursePool(coursepool);
            console.log("coursepool", coursepool);
        } catch (error) {
            console.error(error);
        }
    }
    useEffect(() => {
        fetchCoursePool(props.layerId);
    }, [props.layerId]);


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
                <div className='mt-16 z-50 max-h-[45rem] overflow-y-auto overflow-x-visible w-full'>
                    {filteredList?.length > 0 ? (
                        filteredList.map((poolItem, index) => (
                            <div key={"pool"+poolItem.UE.Id+poolItem.Type} className='flex flex-col flex-gap-2 mb-4 w-full items-center'>
                                {( poolItem.Type === "CM" && poolItem.UE.TotalHourVolume_CM > 0) && <PoolItem
                                    darken={hoveredItem !== -1 && hoveredItem !== index}
                                    type="CM"
                                    PoolItem={poolItem}
                                    onHover={() => setHoveredItem(index)}
                                    onLeave={() => setHoveredItem(-1)}
                                    setHoveredItem={setHoveredItem}
                                    setCurrentCours={props.setCurrentCours}
                                />}
                                {( poolItem.Type === "TD" && poolItem.UE.TotalHourVolume_TD > 0) && <PoolItem
                                    darken={hoveredItem !== -1 && hoveredItem !== index + coursePool.length}
                                    type="TD"
                                    PoolItem={poolItem}
                                    onHover={() => setHoveredItem(index + coursePool.length)}
                                    onLeave={() => setHoveredItem(-1)}
                                    setHoveredItem={setHoveredItem}
                                    setCurrentCours={props.setCurrentCours}
                                />}
                                {( poolItem.Type === "TP" && poolItem.UE.TotalHourVolume_TP > 0) && <PoolItem
                                    darken={hoveredItem !== -1 && hoveredItem !== index + coursePool.length}
                                    type="TP"
                                    PoolItem={poolItem}
                                    onHover={() => setHoveredItem(index + coursePool.length)}
                                    onLeave={() => setHoveredItem(-1)}
                                    setHoveredItem={setHoveredItem}
                                    setCurrentCours={props.setCurrentCours}
                                />}
                            </div>
                        ))
                    ) : (
                        <div><h1>Aucunes Cours trouvés</h1></div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CalendarCoursSelection;
