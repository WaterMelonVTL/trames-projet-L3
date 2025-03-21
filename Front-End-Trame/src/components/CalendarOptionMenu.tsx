import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { Course, Prof } from '../types/types';
import Portal from './Portal';
import {api} from '../public/api/api.js';
import * as CalendarHooks from '../hooks/useCalendarData';

interface CalendarOptionMenuProps {
    cours: Course;
    setCours: React.Dispatch<React.SetStateAction<Course[]>>;
    close: () => void;
    position: { top: number, left: number };
    trammeId: string | undefined;
    isOpen: boolean;
}

export default  function CalendarOptionMenu(props: CalendarOptionMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const startTimes = [8, 9.75, 11.5, 13.25, 15, 16.75, 18.5];

    // New state variables for the Professeur section
    const [teacherName, setTeacherName] = useState('');
    const [teacherStatus, setTeacherStatus] = useState('Permanent');
    
    // Use the mutation hooks with the namespace
    const separateMutation = CalendarHooks.useSeparateCourse();
    const mergeMutation = CalendarHooks.useMergeCourse();

    // pour le scenario du prof existant
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [existingProf, setExistingProf] = useState<Prof | null>(null);
    const [profList, setProfList] = useState<Prof[]>([]);

    const queryClient = useQueryClient();

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
    const addTeacher = async () => {
      try {
        // Search for an existing professor with the same full name in the given tramme.
        const searchResults = await api.get(
          `/profs/search/${props.trammeId}/${teacherName}`
        );
        // Assume searchResults is an array of professors.
        const existing = searchResults.find(
          (p: Prof) => p.FullName.trim().toLowerCase() === teacherName.trim().toLowerCase()
        );
        if (existing) {
          console.log("Professor already exists:", existing);
          setExistingProf(existing);
          // Update the course with the existing professor's Id.
          const courseResponse = await api.put(`/cours/${props.cours.Id}`, {
            course: { ProfId: existing.Id },
          });
          console.log("Course updated with existing ProfId:", courseResponse);
          return;
        }
        
        // If no existing professor is found, create a new one.
        const response = await api.post("/profs", {
          prof: {
            FullName: teacherName,
            Status: teacherStatus,
            TrammeId: props.trammeId,
          },
        });
        const newProf = response; // API returns the new professor object.
        console.log("Teacher added", newProf);
        setExistingProf(newProf);
        setProfList([]);
        
        // Now update the course with the new professor's Id.
        const courseResponse = await api.put(`/cours/${props.cours.Id}`, {
          course: { ProfId: newProf.Id },
        });
        console.log("Course updated with new ProfId:", courseResponse);
      } catch (error) {
        console.error("Error adding teacher and updating course:", error);
      }
    };
    
      
      
      

    // Update teacher
    const updateTeacher = async () => {
        if (!existingProf) return;
        try {
          // Update the existing professor
          await api.put(`/profs/${existingProf.Id}`, {
            prof: {
              FullName: teacherName,
              Status: teacherStatus,
              TrammeId: props.trammeId,
            },
          });
          console.log("Teacher updated successfully");
      
          const updatedProf = { ...existingProf, FullName: teacherName, Status: teacherStatus };
      
          // Update the course with the new professor info
          await api.put(`/cours/${props.cours.Id}`, {
            course: {
              ProfId: updatedProf.Id,
              ProfFullName: updatedProf.FullName,
            },
          });
          console.log("Course updated with new professor:", updatedProf);
      
          // Update global state
          props.setCours((prevCourses) =>
            prevCourses.map(course =>
              course.Id === props.cours.Id
                ? { ...course, ProfId: updatedProf.Id, ProfFullName: updatedProf.FullName }
                : course
            )
          );
      
          // Invalidate the cached professor data after updating,
          // and trigger an immediate refetch.
          if (props.cours.ProfId != null) {
            await queryClient.invalidateQueries({ queryKey: ['prof', props.cours.ProfId] });
            await queryClient.refetchQueries({ queryKey: ['prof', props.cours.ProfId] });
          }
      
          // Update local state and exit edit mode
          setExistingProf(updatedProf);
          setIsEditing(false);
        } catch (error) {
          console.error("Error updating teacher and course:", error);
        }
      };
      
      useEffect(() => {
        console.log("CalendarOptionMenu - existingProf updated:", existingProf);
      }, [existingProf]);
      
      
      
      

      useEffect(() => {
        async function fetchCourseProf() {
          if (props.cours.ProfId) {
            try {
              // Append a cache buster to force a fresh fetch
              const prof = await api.get(
                `/profs/${props.cours.ProfId}?cacheBuster=${Date.now()}`
              );
              console.log("Re-fetched professor:", prof);
              setExistingProf(prof);
              setTeacherName(prof.FullName);
              setTeacherStatus(prof.Status);
            } catch (error) {
              console.error("Error re-fetching professor for course:", error);
            }
          } else {
            setExistingProf(null);
            setTeacherName("");
            setTeacherStatus("Permanent");
          }
        }
        if (props.isOpen) {
          fetchCourseProf();
        }
      }, [props.isOpen, props.cours.ProfId, props.cours.ProfFullName]);
      
      

      useEffect(() => {
        console.log("CalendarOptionMenu mounted");
        console.log(props.isOpen);

        return () => {
          console.log("CalendarOptionMenu unmounted");
          console.log(props.isOpen);
        };
      }, []);

      

      useEffect(() => {
        // Only trigger the search if searchQuery is not empty
        if (!searchQuery.trim()) {
          return;
        }
      
        const fetchProfs = async () => {
          try {
            const response = await api.get(
              `/profs/search/${props.trammeId}/${searchQuery}`
            );
            // Assuming response is the array of professors:
            setProfList(response);
            // Look for an exact match with teacherName (case-insensitive)
            const match = response.find(
              (prof: Prof) =>
                prof.FullName.trim().toLowerCase() === teacherName.trim().toLowerCase()
            );
            if (match) {
              setExistingProf(match);
            } else {
              // Only clear existingProf if the user is actively searching
              setExistingProf(null);
            }
          } catch (error) {
            console.error("Error fetching profs:", error);
          }
        };
      
        fetchProfs();
      }, [searchQuery, props.trammeId, teacherName]);
      
    
    

    const Separate = async (id: number) => {
        try {
            // Use the mutation hook instead of direct API call
            await separateMutation.mutateAsync({
                courseId: id,
                trammeId: props.cours.TrammeId,
                layerId: props.cours.LayerId
            });
            
            // Close menu after successful operation
            props.close();
        } catch (error) {
            console.error('Failed to separate courses:', error);
        }
    };

    const Merge = async (id: number) => {
        try {
            // Use the mutation hook instead of direct API call
            await mergeMutation.mutateAsync({
                courseId: id,
                trammeId: props.cours.TrammeId,
                layerId: props.cours.LayerId
            });
            
            // Close menu after successful operation
            props.close();
        } catch (error) {
            console.error('Failed to merge courses:', error);
        }
    };

    useEffect(() => {
        console.log("Updated existingProf:", existingProf);
      }, [existingProf]);
      


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
                    <div className="relative flex flex-col border p-3 rounded-md w-1/3">
                    <h2 className="text-lg font-semibold text-gray-700 text-center mb-2">Professeur</h2>
                    {existingProf && !isEditing ? (
                        // Display mode: show existing professor's info with a "Modifier" button
                        <div className="flex flex-col gap-2">
                        <p>Nom: {existingProf.FullName}</p>
                        <p>Status: {existingProf.Status}</p>
                        <button
                            className="w-full py-1 rounded-md bg-green-500 text-white hover:bg-indigo-600 transition"
                            onClick={() => setIsEditing(true)}
                        >
                            Modifier
                        </button>
                        </div>
                    ) : (
                        // Edit/Add mode: show input fields and add/update button
                        <div className="relative">
                        <input
                            type="text"
                            placeholder="Nom du professeur"
                            value={teacherName}
                            onChange={(e) => {
                            setTeacherName(e.target.value);
                            setSearchQuery(e.target.value);
                            setExistingProf(null); // Reset selection on typing
                            setIsEditing(false);
                            }}
                            className="border p-1 rounded-md w-full"
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
                            onClick={existingProf ? updateTeacher : addTeacher}
                        >
                            {'Ajouter'}
                        </button>
                        {/* Dropdown list for search results */}
                    {profList && profList.length > 0 && (
                      <ul className="absolute top-full left-0 z-10 bg-white border rounded-md w-full max-h-60 overflow-y-auto mt-1">                        
                      {profList.map((prof) => (
                        <li
                            key={prof.Id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={async () => {
                            // Update local state
                            setTeacherName(prof.FullName);
                            setTeacherStatus(prof.Status);
                            setExistingProf(prof);
                            setSearchQuery(''); // Clear search so input shows selected teacher
                            setProfList([]);    // Clear dropdown list

                            // Update the Course with the selected professor
                            try {
                                const response = await api.put(`/cours/${props.cours.Id}`, {
                                course: {
                                    ProfId: prof.Id,
                                    ProfFullName: prof.FullName,
                                },
                                });
                                setExistingProf(prof);
                                console.log(response);

                                // Update global state so the course display updates
                                props.setCours((prevCourses) => {
                                    const updatedCourses = prevCourses.map(course =>
                                      course.Id === props.cours.Id
                                        ? { ...course, ProfId: existingProf.Id, ProfFullName: teacherName }
                                        : course
                                    );
                                    console.log("Updated courses:", updatedCourses);
                                    return updatedCourses;
                                  });
                            } catch (error) {
                                console.error('Error updating course with new professor:', error);
                            }
                            }}
                        >
                            {prof.FullName} - {prof.Status}
                        </li>
                        ))}
                    </ul>
                    )}
                        </div>
                    )}
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
