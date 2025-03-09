import { useState, useEffect } from 'react';
import { CoursePool, Course, GroupedCoursePool } from '../types/types';
import { api } from '../public/api/api.js';
import PoolItem from './PoolItem';
import { useGroups } from '../hooks/useApiData'; // Import the useGroups hook

function CalendarCoursSelection(props: { setCurrentCours: (UE: Course | null) => void, layerId: number, refreshTrigger?: number }) {

    const [hoveredItem, setHoveredItem] = useState<number>(-1);
    const [isSearching, setIsSearching] = useState<string>("");

    const [coursePool, setCoursePool] = useState<CoursePool[]>([]);
    const [groupedPool, setGroupedPool] = useState<GroupedCoursePool[]>([]);

    const [filteredList, setFilteredList] = useState<GroupedCoursePool[]>([]);
    
    // Fetch all groups using the cache
    const { data: groups = [] } = useGroups();

    // Group course pool items by UE, Type, and Volume
    const groupPoolItems = (poolItems: CoursePool[]): GroupedCoursePool[] => {
        const groupedMap = new Map<string, GroupedCoursePool>();
        
        poolItems.forEach(item => {
            // Create a unique key for each UE+Type+Volume combination
            const key = `${item.UE.Id}-${item.Type}-${item.Volume}`;
            
            if (!groupedMap.has(key)) {
                groupedMap.set(key, {
                    UE: item.UE,
                    Type: item.Type,
                    Volume: item.Volume,
                    GroupIds: [item.GroupId]
                });
            } else {
                // Add this group ID to the existing entry
                groupedMap.get(key)!.GroupIds.push(item.GroupId);
            }
        });
        
        // Convert map to array
        return Array.from(groupedMap.values());
    };

    useEffect(() => {
        if (isSearching === "") {
            setFilteredList(groupedPool);
        } else {
            setFilteredList(groupedPool.filter(poolItem => 
                poolItem.UE.Name.toLowerCase().includes(isSearching.toLowerCase())
            ));
        }
    }, [groupedPool, isSearching]);

    const fetchCoursePool = async (layerId:number) => {
        try {
            const coursepool = await api.get('/ues/remainingpool/' + layerId);
            // Sort: negatives first, then positives, then zeros.
            const sortedPool = coursepool.sort((a, b) => {
                const groupA = a.Volume < 0 ? 0 : a.Volume > 0 ? 1 : 2;
                const groupB = b.Volume < 0 ? 0 : b.Volume > 0 ? 1 : 2;
                if (groupA !== groupB) {
                    return groupA - groupB;
                }
                return b.Volume - a.Volume;
            });
            
            setCoursePool(sortedPool);
            
            // Process and group the pool items
            const grouped = groupPoolItems(sortedPool);
            setGroupedPool(grouped);
            console.log("Grouped coursepool:", grouped);
        } catch (error) {
            console.error(error);
        }
    }
    
    useEffect(() => {
        fetchCoursePool(props.layerId);
    }, [props.layerId]);

    useEffect(() => {
        if (props.refreshTrigger !== undefined) {
            fetchCoursePool(props.layerId);
        }
    }, [props.refreshTrigger, props.layerId]);

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
                            <div key={"pool"+poolItem.UE.Id+poolItem.Type+poolItem.GroupIds.join('-')} className='flex flex-col flex-gap-2 mb-4 w-full items-center'>
                                {(poolItem.Type === "CM" && poolItem.UE.TotalHourVolume_CM > 0) && <PoolItem
                                    darken={hoveredItem !== -1 && hoveredItem !== index}
                                    type="CM"
                                    poolItem={poolItem}
                                    onHover={() => setHoveredItem(index)}
                                    onLeave={() => setHoveredItem(-1)}
                                    setHoveredItem={setHoveredItem}
                                    setCurrentCours={props.setCurrentCours}
                                    groups={groups} // Pass the groups data
                                />}
                                {(poolItem.Type === "TD" && poolItem.UE.TotalHourVolume_TD > 0) && <PoolItem
                                    darken={hoveredItem !== -1 && hoveredItem !== index + groupedPool.length}
                                    type="TD"
                                    poolItem={poolItem}
                                    onHover={() => setHoveredItem(index + groupedPool.length)}
                                    onLeave={() => setHoveredItem(-1)}
                                    setHoveredItem={setHoveredItem}
                                    setCurrentCours={props.setCurrentCours}
                                    groups={groups} // Pass the groups data
                                />}
                                {(poolItem.Type === "TP" && poolItem.UE.TotalHourVolume_TP > 0) && <PoolItem
                                    darken={hoveredItem !== -1 && hoveredItem !== index + groupedPool.length}
                                    type="TP"
                                    poolItem={poolItem}
                                    onHover={() => setHoveredItem(index + groupedPool.length)}
                                    onLeave={() => setHoveredItem(-1)}
                                    setHoveredItem={setHoveredItem}
                                    setCurrentCours={props.setCurrentCours}
                                    groups={groups} // Pass the groups data
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
