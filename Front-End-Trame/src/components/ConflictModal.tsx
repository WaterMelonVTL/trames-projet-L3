import React, { useEffect } from 'react'
import { Group, Course } from '../types/types'
import { useState } from 'react'
import { useUEs, useGroups } from "../hooks/useApiData.js";
import { api } from '../public/api/api.js'

function ConflictModal({ id, onClose }: { id: number, onClose: () => void }) {
    const [selectedOption, setSelectedOption] = useState<string>('');
    const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
    const { isLoading: loading, data: UEs } = useUEs();
    const { isLoading: loadingGroups, data: groups } = useGroups();
    const [group, setGroup] = useState<number>(-1);
    const [courses, setCourses] = useState<Course[]>([]);

    useEffect(() => {
        // fetch data
        const fetchConflict = async (id: number) => {
            console.log('fetching conflict');
            console.log(id);
            try {
                const conflict = await api.get(`/cours/conflicts/${id}`);
                setGroup(conflict.GroupId);
                setCourses(conflict.Courses);
            }
            catch (e) {
                console.error(e);
            }

        }

        fetchConflict(id)
    }, [])

    const getGroupName = (groupId: number) => {
        const group = groups.find(group => group.Id === groupId);
        return group ? group.Name : '';
    }

    const getUEName = (UEId: number) => {
        const UE = UEs.find(UE => UE.Id === UEId);
        return UE ? UE.Name : '';
    }

    const handleClose = async () => {
        await api.post(`/cours/conflicts/${id}/resolve`, {
            option: selectedOption,
            courses: selectedCourses.map(c => c.Id)
        })
        onClose();
        return;
    }
    if (loading || loadingGroups) {
        return (
            <div className='fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50'>
                <div className='animate-pulse border-2 rounded-lg bg-white p-6 shadow-lg'>
                    <p className='text-gray-500'>Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50'>
            <div className='bg-white border-2 rounded-lg p-6 shadow-lg max-w-lg w-full'>
                <h1 className='text-xl font-bold mb-4'>Conflit détecté pour le groupe : {getGroupName(group)}</h1>
                <h2 className='text-lg mb-4'>Veuillez choisir une option pour régler le conflit</h2>
                <div className='flex flex-col items-start'>
                    <div className='mb-4'>
                        <input type="radio" id="ignore" name="conflict" value="ignore" onChange={(e) => { setSelectedOption(e.target.value) }} />
                        <label htmlFor="ignore" className='ml-2'>Ignorer</label>
                    </div>
                    <div className='mb-4'>
                        <input type="radio" id="move" name="conflict" value="keep" onChange={(e) => { setSelectedOption(e.target.value) }} />
                        <label htmlFor="move" className='ml-2'>Garder :</label>
                        {selectedOption == "keep" && <ul className='ml-6 mt-2'>
                            {courses.map(course => (
                                <li key={course.Id} className='mb-2'>
                                    <input type="checkbox" id={course.Id} name={"courseToKeep"} value={course.Id} onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedCourses([...selectedCourses, course])
                                        } else {
                                            setSelectedCourses(selectedCourses.filter(c => c.Id !== course.Id))
                                        }
                                    }} />
                                    <label htmlFor={course.Id} className='ml-2'>
                                        {getUEName(course.UEId)}
                                    </label>
                                </li>
                            ))}
                        </ul>}
                    </div>
                    <div className='mb-4'>
                        <input type="radio" id="alternate" name="conflict" value="alternate" onChange={(e) => { setSelectedOption(e.target.value) }} />
                        <label htmlFor="alternate" className='ml-2'>Alterner</label>
                    </div>
                    <div className='mb-4'>
                        <input type="radio" id="sequence" name="conflict" value="sequence" onChange={(e) => { setSelectedOption(e.target.value) }} />
                        <label htmlFor="sequence" className='ml-2'>Sequence</label>
                    </div>
                </div>
                <p className='text-red-500 mb-4'>
                    {selectedOption === 'keep' && selectedCourses.length > 0 && `Vous avez choisi de garder les cours suivants : ${selectedCourses.map(c => getUEName(c.UEId)).join(', ')} le reste des cours de ce créneau sera supprimé`}
                    {selectedOption === 'keep' && selectedCourses.length == 0 && `Veuillez sélectionner au moins un cours`}
                    {selectedOption === '' && selectedCourses.length == 0 && `Veuillez sélectionner une option`}
                </p>
                <div className='flex justify-end'>

                    <button
                        onClick={handleClose}
                        disabled={selectedOption === '' || (selectedOption === 'keep' && selectedCourses.length === 0)}
                        className={`px-4 py-2 rounded-lg ${selectedOption === '' || (selectedOption === 'keep' && selectedCourses.length === 0) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    >
                        Valider
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConflictModal;