import React, { useState, useEffect } from 'react'
import CalendarFrame from './CalendarFrame'
import CalendarCoursSelection from './CalendarCoursSelection'
import EcuItem from './EcuItem';
import { Course, UE, Layer, Tramme } from '../types/types';
import { useLocation, useSearchParams } from 'react-router-dom'; // <-- added useSearchParams
import CalendarLayerSelection from './CalendarLayerSelection';
import { api } from '../public/api/api.js'; // <-- added api import
import CalendarPoolSelection from './CalendarPoolSelection';
import * as XLSX from 'xlsx';
import { Input } from 'react-select/animated';
import LoadingAnimation from './LoadingAnimation.js';
import {
  useTramme,
  useLayers,
  useUEsByLayer,
  useGroupsByLayer,
  useClassesForWeek,
  useAddCourse,
  useDeleteCourse,
  useUpdateLayer,
  getMonday
} from '../hooks/useCalendarData';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

// Wrap the component with QueryClientProvider
function CalendarPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <CalendarPageContent />
    </QueryClientProvider>
  );
}

function CalendarPageContent() {
  // Retrieve date from url query parameter
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const initialDate = dateParam ? getMonday(new Date(dateParam)) : getMonday(new Date('2001-01-01'));

  // Use the date from the url if present or default value
  const [defaultDate, setDefaultDate] = useState<Date>(initialDate);

  const [currentCours, setCurrentCours] = useState<Course | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const location = useLocation();
  const trammeId = location.pathname.split('/').pop() || '';

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedCourseType, setSelectedCourseType] = useState<string | null>(null);
  const [currentLayerId, setCurrentLayerId] = useState<number | null>(null);
  const [poolRefreshCounter, setPoolRefreshCounter] = useState<number>(0);

  const [loadingPercentage, setLoadingPercentage] = useState<number | undefined>(undefined);

  // Use React Query hooks for data fetching
  const { data: trammeData, isLoading: isTrammeLoading } = useTramme(trammeId);
  const { data: layers = [], isLoading: isLayersLoading } = useLayers(trammeId);
  const updateLayerMutation = useUpdateLayer();

  // Set initial layer ID when layers are loaded
  useEffect(() => {
    if (layers?.length > 0 && !currentLayerId) {
      setCurrentLayerId(layers[0].Id);
    }
  }, [layers]);

  // Fetch UEs for the current layer
  const { data: ues = [] } = useUEsByLayer(currentLayerId);

  // Group UEs by layer ID
  const uesByLayer = React.useMemo(() => {
    if (!layers || !ues) return {};

    return layers.reduce((acc: { [key: string]: UE[] }, layer: Layer) => {
      acc[layer.Id] = ues.filter((ue: UE) => ue.LayerId === layer.Id);
      return acc;
    }, {} as { [key: string]: UE[] });
  }, [layers, ues]);

  // Fetch groups for the current layer
  const { data: groups = [] } = useGroupsByLayer(currentLayerId);

  // Fetch classes for the current week
  const {
    data: weekClasses = [],
    isLoading: isClassesLoading
  } = useClassesForWeek(defaultDate, trammeId, currentLayerId);

  // Filter courses by selected group and course type
  const filteredCours = React.useMemo(() => {
    let filtered = weekClasses;

    // Filter by group if one is selected
    if (selectedGroupId !== null) {
      filtered = filtered.filter(course =>
        course.Groups && course.Groups.some(group => group.Id === selectedGroupId)
      );
    }

    // Filter by course type if one is selected
    if (selectedCourseType !== null) {
      filtered = filtered.filter(course => course.Type === selectedCourseType);
    }

    return filtered;
  }, [weekClasses, selectedGroupId, selectedCourseType]);

  // Use the mutation hook for adding courses
  const addCourseMutation = useAddCourse();

  // Add the deletion mutation hook
  const deleteCourseMutation = useDeleteCourse();

  // Helper function to update both state and URL query
  function updateDate(newDate: Date) {
    // Format date in local time (YYYY-MM-DD)
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(newDate.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    setSearchParams({ date });
  }

  // AddCours function using the mutation
  async function AddCours(course: Course, date: string, time: string) {
    let selectedGroups;

    if (course.Groups) {
      selectedGroups = course.Groups;
    } else if (selectedGroupId !== null) {
      const selectedGroup = groups.find(group => group.Id === selectedGroupId);
      if (selectedGroup) {
        selectedGroups = [selectedGroup];
      } else {
        console.error("Selected group not found in loaded groups");
        return;
      }
    } else {
      selectedGroups = await api.cache.getGroupsByLayer(currentLayerId, true);
    }

    if (!selectedGroups || selectedGroups.length === 0) {
      console.error("No groups selected for the course");
      return;
    }

    try {
      // Check if this is a move operation (course has originalId)
      const isMoving = course.originalId !== undefined;

      await addCourseMutation.mutateAsync({
        course: {
          UEId: course.UEId,
          Type: course.Type,
          Date: date,
          StartHour: time,
          length: course.length,
        },
        groups: selectedGroups,
        separate: (course.Type === 'TD' || course.Type === 'TP') && course.Id === -1,
        trammeId,
        layerId: currentLayerId,
        isMoving,
        originalId: course.originalId
      });

      // Trigger refresh for CalendarPoolSelection
      setPoolRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error('Failed to add the course', error);
    }
  }

  // Create a function to handle course deletion
  const handleDeleteCourse = (courseId: number | string, date: string, forMoving = false) => {
    try {
      // Guard against undefined or invalid IDs
      if (!courseId) {
        console.error("Attempted to delete course with invalid ID:", courseId);
        return;
      }
      setPoolRefreshCounter(prev => prev + 1);

      console.log(`CalendarPage deleting course ${courseId}, isMoving=${forMoving}`);

      deleteCourseMutation.mutate({
        courseId,
        trammeId,
        layerId: currentLayerId,
        date,
        isMoving: forMoving,
        setPoolRefreshCounter  
      }, {
        // Add onSuccess callback here to handle the successful deletion
        onSuccess: () => {
          // Only update currentCours if this is a move operation
          if (forMoving && currentCours) {
            console.log(`Setting originalId=${courseId} for current course`);
            setCurrentCours({
              ...currentCours,
              originalId: courseId
            });
          }

          // For deletes, the pool refresh is now handled inside the mutation
        },

        // Additional error handling 
        onError: (error) => {
          console.error("Error deleting course:", error);
          // Consider showing a toast or alert to the user
        }
      });
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  // Navigation functions
  const nextWeek = () => {
    const newDate = getMonday(defaultDate);
    newDate.setDate(newDate.getDate() + 7);
    updateDate(newDate);
  }

  const previousWeek = () => {
    const newDate = getMonday(defaultDate);
    newDate.setDate(newDate.getDate() - 7);
    updateDate(newDate);
  }

  const resetToBaseline = () => {
    updateDate(new Date('2001-01-01'));
  }

  const goToFirstWeek = () => {
    if (trammeData) updateDate(getMonday(new Date(trammeData.StartDate)));
  }

  const goToLastWeek = () => {
    if (trammeData) updateDate(getMonday(new Date(trammeData.EndDate)));
  }

  async function duplicate() {
    setIsLoading("Tramme en cours de génération");
    setLoadingPercentage(0);
    
    // Start a polling interval to check progress
    const progressInterval = setInterval(async () => {
      try {
        const progressData = await api.get(`/trammes/duplicate-progress/${trammeId}`);
        if (progressData) {
          // Update percentage for progress bar
          setLoadingPercentage(progressData.percentageTotal || 0);
          
          // Update loading text based on state
          const state = progressData.state || 'initialisation';
          const layer = progressData.currentLayer ? ` - ${progressData.currentLayer}` : '';
          const percentage = progressData.percentageTotal ? ` (${progressData.percentageTotal}%)` : '';
          setLoadingPercentage(progressData.percentageTotal || 0);
          let statusMessage;
          switch(state) {
            case 'initialisation':
              statusMessage = "Initialisation de la génération...";
              break;
            case 'chargement des données':
              statusMessage = "Chargement des données...";
              break;
            case 'chargement des couches':
              statusMessage = "Chargement des couches...";
              break;
            case 'préparation de la génération':
              statusMessage = "Préparation de la génération...";
              break;
            case 'chargement des UEs':
              statusMessage = `Chargement des UEs${layer}`;
              break;
            case 'préparation des cours':
              statusMessage = `Préparation des cours${layer}`;
              break;
            case 'génération des jours':
              statusMessage = `Génération des jours${layer}${percentage}`;
              break;
            case 'mise à jour des heures restantes dans la base de données':
              statusMessage = `Mise à jour des heures restantes${layer}`;
              break;
            case 'finalisation':
              statusMessage = "Finalisation de la génération...";
              break;
            case 'erreur':
              statusMessage = "Une erreur est survenue durant la génération";
              break;
            default:
              statusMessage = `${state}${layer}${percentage}`;
          }
          
          setIsLoading(statusMessage);
          
          // Stop polling if we're done or there's an error
          if (state === 'finalisation' || state === 'erreur' || progressData.percentageTotal === 100) {
            if (state === 'erreur') {
              setTimeout(() => setIsLoading(null), 1000);
              clearInterval(progressInterval);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    }, 500); // Check every 500ms
    
    try {
      await api.delete("/trammes/clear-courses/" + trammeId);
      let newDate = await api.post(`/trammes/duplicate/${trammeId}`);
      
      // Clear the interval once the main request completes
      clearInterval(progressInterval);
      
      newDate = new Date(newDate);
      if (newDate.getDay() !== 1) {
        newDate = getMonday(newDate);
      }
      queryClient.invalidateQueries({ queryKey: ['classes'] });

      updateDate(newDate);
      queryClient.invalidateQueries({ queryKey: ['classes'] });

      window.location.reload(); // IMPORTANT TO AVOID GHOST CLASSES WITH UNPREDICTABLE BEHAVIOR
      setIsLoading("Génération terminée, vous allez être redirigé");

    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error duplicating tramme:", error);
      setIsLoading("Erreur lors de la génération");
      setTimeout(() => setIsLoading(null), 3000);
    }
  }

  // Keep track of loading state
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Handle mouse movement for drag and drop
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Update default date when URL params change
  useEffect(() => {
    const param = searchParams.get("date");
    if (param) {
      setDefaultDate(getMonday(new Date(param)));
    } else {
      setDefaultDate(getMonday(new Date('2001-01-01')));
    }
  }, [searchParams]);

  // Display loading animation if data is loading
  const layerColors = layers.map((layer) => layer.Color);
  if (isLoading || isTrammeLoading || isLayersLoading) {
    return <LoadingAnimation texte={isLoading || "Chargement..."} colors={layerColors} percentage={loadingPercentage}/>;
  }



  function calculateEndTime(startHour: string, length: number): string {
    const [hours, minutes] = startHour.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours);
    endDate.setMinutes(minutes + length * 60);
    endDate.setSeconds(0); // Reset seconds to 0 (maybe i don't understand correctly length)
    return endDate.toTimeString().split(' ')[0];
  }


  async function fetchClassesForWeek(monday: Date) {
    const classes = [];
    for (let i = -1; i < 6; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dayClasses = await api.get(`/cours/date/${trammeId}/${currentLayerId}/${date.toISOString().split('T')[0]}`);

      // Fetch additional information for each class
      const formattedClasses = await Promise.all(dayClasses.map(async (course: any) => {
        const ueData = await api.get(`/ues/${course.UEId}`);
        const profData = course.ProfId ? await api.get(`/profs/${course.ProfId}`) : null;
        const endTime = calculateEndTime(course.StartHour, course.length);

        return {
          ...course,
          UEName: ueData.Name,
          ProfFullName: profData ? profData.FullName : null,
          EndHour: endTime
        };
      }));

      classes.push(formattedClasses);
    }
    return classes;
  }

  async function fetchClassesForPeriod(startMonday: Date, endMonday: Date) {
    const weeks = [];
    const currentMonday = new Date(startMonday);

    while (currentMonday <= endMonday) {
      const weekClasses = await fetchClassesForWeek(currentMonday);
      weeks.push(weekClasses);
      currentMonday.setDate(currentMonday.getDate() + 7);
    }

    return weeks;
  }

  const handleExportWeeks = async () => {
    if (!trammeData) {
      alert('No tramme data found.');
      return;
    }
    setIsLoading("Exportation en cours");

    const duplicateStart = new Date(trammeData.StartDate);
    const duplicateEnd = new Date(trammeData.EndDate);
    if (duplicateStart && duplicateEnd) {
      const weeks = await fetchClassesForPeriod(getMonday(new Date(duplicateStart)), getMonday(new Date(duplicateEnd)));
      generateExcel(weeks);
    } else {
      setIsLoading(null);

      alert('Please select both start and end weeks.');
    }
  };

  const generateExcel = (weeks: any[]) => {
    const duplicateStart = new Date(trammeData.StartDate);
    const duplicateEnd = new Date(trammeData.EndDate);
    const workbook = XLSX.utils.book_new();
    console.log("uesdata : ", ues);
    // Create a sheet for each UE
    const ueSheets: { [key: string]: any } = {};

    weeks.forEach((week, weekIndex) => {
      week.forEach((day, dayIndex) => {
        day.forEach((course: any) => {
          if (!ueSheets[course.UEName]) {
            ueSheets[course.UEName] = {
              CM: {},
              TD: {},
              TP: {}
            };
          }
          const timeSlot = `${course.StartHour}-${course.EndHour}`;
          const groups = course.Groups.map((group: any) => group.Name).join(', ');
          if (!ueSheets[course.UEName][course.Type][timeSlot]) {
            ueSheets[course.UEName][course.Type][timeSlot] = {};
          }
          if (!ueSheets[course.UEName][course.Type][timeSlot][dayIndex]) {
            ueSheets[course.UEName][course.Type][timeSlot][dayIndex] = [];
          }
          const existingEntry = ueSheets[course.UEName][course.Type][timeSlot][dayIndex].find((entry: any) => entry.groups === groups);
          if (existingEntry) {
            existingEntry.weeks[weekIndex] = true;
          } else {
            ueSheets[course.UEName][course.Type][timeSlot][dayIndex].push({
              prof: course.ProfFullName || 'ZZ',
              groups: groups,
              weeks: Array(weeks.length).fill(false)
            });
            ueSheets[course.UEName][course.Type][timeSlot][dayIndex].forEach((info: any) => {
              info.weeks[weekIndex] = true;
            });
          }
        });
      });
    });

    const daysInFrench = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    Object.keys(ueSheets).forEach(ueName => {
      const ue = Object.values(ues).flat().find((ue: UE) => ue.Name === ueName);
      const worksheetData = [
        ["Mention", layers.find(layer => layer.Id === currentLayerId)?.Name],
        ["Parcours", trammeData.Name || ""],
        ["Responsable", ue?.ResponsibleName || ""],
        ["Code UE", ueName],
        [],
        ["Volume horaire total"],
        ["CM", ue?.TotalHourVolume_CM || 0],
        ["TD", ue?.TotalHourVolume_TD || 0],
        ["TP", ue?.TotalHourVolume_TP || 0],
        [],
        ["Cours Magistraux (CM)"],
        ["Jour", "Créneau", "Créneau non classique", "Enseignant", "Groupe/série", "Effectif", "Salle", ...weeks.map((_, index) => {
          const weekStartDate = new Date(duplicateStart);
          weekStartDate.setDate(weekStartDate.getDate() + (index * 7));
          return `S${36 + index} ${weekStartDate.toLocaleDateString('fr-FR')}`;
        })]
      ];

      Object.keys(ueSheets[ueName].CM).forEach(timeSlot => {
        Object.keys(ueSheets[ueName].CM[timeSlot]).forEach(dayIndex => {
          ueSheets[ueName].CM[timeSlot][dayIndex].forEach((info: any) => {
            const row = [
              daysInFrench[dayIndex],
              timeSlot,
              '',
              info.prof,
              info.groups,
              '',
              '',
              ...info.weeks.map((week: boolean) => (week ? 'X' : ''))
            ];
            worksheetData.push(row);
          });
        });
      });

      worksheetData.push([]);
      worksheetData.push(["Travaux Dirigés (TD)"]);
      worksheetData.push(["Jour", "Créneau", "Créneau non classique", "Enseignant", "Groupe/série", "Effectif", "Salle", ...weeks.map((_, index) => {
        const weekStartDate = new Date(duplicateStart);
        weekStartDate.setDate(weekStartDate.getDate() + (index * 7));
        return `S${36 + index} ${weekStartDate.toLocaleDateString('fr-FR')}`;
      })]);

      Object.keys(ueSheets[ueName].TD).forEach(timeSlot => {
        Object.keys(ueSheets[ueName].TD[timeSlot]).forEach(dayIndex => {
          ueSheets[ueName].TD[timeSlot][dayIndex].forEach((info: any) => {
            const row = [
              daysInFrench[dayIndex],
              timeSlot,
              '',
              info.prof,
              info.groups,
              '',
              '',
              ...info.weeks.map((week: boolean) => (week ? 'X' : ''))
            ];
            worksheetData.push(row);
          });
        });
      });

      worksheetData.push([]);
      worksheetData.push(["Travaux Pratiques (TP)"]);
      worksheetData.push(["Jour", "Créneau", "Créneau non classique", "Enseignant", "Groupe/série", "Effectif", "Salle", ...weeks.map((_, index) => {
        const weekStartDate = new Date(duplicateStart);
        weekStartDate.setDate(weekStartDate.getDate() + (index * 7));
        return `S${36 + index} ${weekStartDate.toLocaleDateString('fr-FR')}`;
      })]);

      Object.keys(ueSheets[ueName].TP).forEach(timeSlot => {
        Object.keys(ueSheets[ueName].TP[timeSlot]).forEach(dayIndex => {
          ueSheets[ueName].TP[timeSlot][dayIndex].forEach((info: any) => {
            const row = [
              daysInFrench[dayIndex],
              timeSlot,
              '',
              info.prof,
              info.groups,
              '',
              '',
              ...info.weeks.map((week: boolean) => (week ? 'X' : ''))
            ];
            worksheetData.push(row);
          });
        });
      });

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, ueName);
    });

    // Generate Excel file
    XLSX.writeFile(workbook, trammeData.Name + "-" + layers.find(layer => layer.Id === currentLayerId)?.Name + '.xlsx');
    setIsLoading(null);
  };

  return (
    <div className="w-screen h-screen bg-gray-200  pt-8"
      onMouseUp={() => { setCurrentCours(null) }}>

      <div className='flex justify-around items-start relative mt-16'>
        {defaultDate.getTime() === new Date('2001-01-01').getTime() ?
          <CalendarCoursSelection setCurrentCours={setCurrentCours} ecus={currentLayerId ? uesByLayer[currentLayerId] : [{ Name: "No currentLayerId" }]} /> :
          <CalendarPoolSelection setCurrentCours={setCurrentCours} layerId={currentLayerId || -1} refreshTrigger={poolRefreshCounter} />
        }
        <div className='flex flex-col'>
          <div className='flex justify-between items-end w-[80vw]'>
            <CalendarLayerSelection
              layers={layers}
              updateLayer={(layer) => updateLayerMutation.mutate(layer)}
              onClick={(id: number) => setCurrentLayerId(id)}
              currentLayerId={currentLayerId || -1}
            />

            <div className="flex gap-2">
              {/* Group filter dropdown */}
              {groups.length > 0 && (
                <select
                  className="px-3 py-1 border rounded-lg flex-grow bg-white mb-2 shadow-md"
                  onChange={(e) => setSelectedGroupId(e.target.value === "all" ? null : parseInt(e.target.value))}
                  value={selectedGroupId || "all"}
                >
                  <option value="all">Tous les groupes</option>
                  {groups.map(group => (
                    <option key={group.Id} value={group.Id}>
                      {group.Name}
                    </option>
                  ))}
                </select>
              )}

              {/* Course type filter dropdown */}
              <select
                className="px-3 py-1 border rounded-lg flex-grow bg-white mb-2 shadow-md"
                onChange={(e) => setSelectedCourseType(e.target.value === "all" ? null : e.target.value)}
                value={selectedCourseType || "all"}
              >
                <option value="all">Tous les types</option>
                <option value="CM">CM</option>
                <option value="TD">TD</option>
                <option value="TP">TP</option>
              </select>
            </div>
          </div>

          <CalendarFrame
            setPoolRefreshCounter={setPoolRefreshCounter}
            setCurrentCours={setCurrentCours}
            currentCours={currentCours}
            AddCours={AddCours}
            fetchedCourse={filteredCours}
            setCours={() => { }} // We don't need to set course externally anymore
            trammeId={trammeId}
            date={defaultDate}
            color={currentLayerId ? layers.find(layer => layer.Id === currentLayerId)?.Color || "#ffffff" : "#ffffff"}
            onDeleteCourse={handleDeleteCourse}
          />
        </div>
      </div>

      {/* Draggable course element */}
      {currentCours && (
        <div className="absolute z-[100] -translate-x-1/2 translate-y-1/2 text-black text-xl w-80"
          style={{ top: `${mousePosition.y}px`, left: `${mousePosition.x}px` }}>
          <EcuItem darken={false} type={currentCours.Type} ueID={currentCours.UEId}
            onHover={() => { }} onLeave={() => { }} onMouseDown={() => { }} />
        </div>
      )}

      {/* Conditional rendering for control buttons */}
      <div className="mt-4 flex flex-col items-center">
        {defaultDate.getTime() === new Date('2001-01-01').getTime() ? (
          <div>
            <button
              className="py-2 px-6 rounded-lg transition-colors duration-200 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
              onClick={() => duplicate()}>
              Appliquer la semaine type
            </button>
          </div>
        ) : (
          <div className="flex justify-around max-w-7xl self-center gap-4">
            {/* Navigation Section */}
            <div className="mb-2 flex flex-col items-center">
              <h3 className="font-bold mb-1 text-blue-800">Navigation</h3>
              <div className="flex gap-2">
                <button
                  className="py-2 px-4 rounded-lg transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white shadow"
                  onClick={() => previousWeek()}>
                  Semaine précédente
                </button>
                <button
                  className="py-2 px-4 rounded-lg transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white shadow"
                  onClick={() => nextWeek()}>
                  Semaine suivante
                </button>
              </div>
            </div>
            {/* Raccourcis Section */}
            <div className="mb-2 flex flex-col items-center">
              <h3 className="font-bold mb-1 text-purple-800">Aller à</h3>
              <div className="flex flex-col gap-2">
                <div className='flex gap-2'>
                  <button
                    className="py-2 px-4 rounded-lg transition-colors duration-200 bg-purple-600 hover:bg-purple-700 text-white shadow"
                    onClick={goToFirstWeek}>
                    Première semaine
                  </button>
                  <button
                    className="py-2 px-4 rounded-lg transition-colors duration-200 bg-purple-600 hover:bg-purple-700 text-white shadow"
                    onClick={goToLastWeek}>
                    Dernière semaine
                  </button>
                </div>
                <div className='flex gap-2'>
                  <h1 className='font-bold mb-1 ml-4 text-purple-800'>Date spécifique : </h1>
                  <input
                    type="date"
                    className='rounded-lg border-2 border-purple-800 flex-grow text-center text-purple-800'
                    value={defaultDate.toISOString().split('T')[0]}
                    onChange={(e) => updateDate(new Date(e.target.value))}
                  />

                </div>
              </div>
            </div>
            {/* Mode Section */}
            <div className="mb-2 flex flex-col items-center">
              <h3 className="font-bold mb-1 text-red-800">Mode</h3>
              <button
                className="py-2 px-6 rounded-lg transition-colors duration-200 bg-red-500 hover:bg-red-600 text-white shadow-lg"
                onClick={() => resetToBaseline()}>
                Retour à la semaine type
              </button>
            </div>
            {/* Utilitaires Section */}
            <div className="mb-2 flex flex-col items-center">
              <h3 className="font-bold mb-1 text-green-800">Utilitaires</h3>
              <button
                className="py-2 px-6 rounded-lg transition-colors duration-200 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                onClick={handleExportWeeks}>
                Exporter la tramme
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarPageWrapper;