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

function CalendarPage() {
  // Retrieve date from url query parameter
  const [searchParams, setSearchParams] = useSearchParams();
  // Modify the initial date to always be a Monday
  const dateParam = searchParams.get("date");
  const initialDate = dateParam ? getMonday(new Date(dateParam)) : getMonday(new Date('2001-01-01'));

  // Use the date from the url if present or default value
  const [defaultDate, setDefaultDate] = useState<Date>(initialDate);

  //TODO: Keep the cours data when dragging, make it use an other type that can keep it.
  const [currentCours, setCurrentCours] = useState<Course | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const location = useLocation();
  const trammeId = location.pathname.split('/').pop();
  const [trammeName, setTrammeName] = useState<string | null>(null);
  const [trammeData, setTrammeData] = useState<Tramme | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [cours, setCours] = useState<Course[]>([]);
  const [currentLayerId, setCurrentLayerId] = useState<number | null>(null);
  const [ues, setUes] = React.useState<{ [key: number]: UE[] }>({})
  const [poolRefreshCounter, setPoolRefreshCounter] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Helper function to update both state and URL query
  function updateDate(newDate: Date) {
    console.log("newDate:", newDate);
    // Format date in local time (YYYY-MM-DD)
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(newDate.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    console.log("date:", date);
    setSearchParams({ date });
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tramme data using the api
        const trammeData = await api.get(`/trammes/${trammeId}`);
        console.log(trammeData);
        setTrammeName(trammeData.Name);
        setTrammeData(trammeData);

        // Fetch layers using the api
        const layersData = await api.get(`/layers/tramme/${trammeId}`);
        setLayers(layersData);
        setCurrentLayerId(layersData[0].Id);

        // Fetch UEs using the api
        const uesData = await api.get(`/ues/tramme/${trammeId}`);
        console.log("uesData:", uesData);
        const uesByLayer = layersData.reduce((acc: { [key: string]: UE[] }, layer: Layer) => {
          acc[layer.Id] = uesData.filter((ue: UE) => ue.LayerId === layer.Id);
          return acc;
        }, {} as { [key: string]: UE[] });
        setUes(uesByLayer);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [trammeId]);

  async function AddCours(course: Course, date: string, time: string) {
    console.log("called add cours :", course, date, time);
    let groups = course.Groups;
    if (!groups) {
      groups = await api.get(`/groups/layer/${currentLayerId}?onlyDefault=true`);
    }
    if (!groups) {
      console.error("No groups found for layer:", currentLayerId);
      return;
    }

    try {
      const data = await api.post(`/cours`, {
        course: {
          UEId: course.UEId,
          Type: course.Type,
          Date: date,
          StartHour: time,
          length: course.length,
        },
        groups: groups,
        separate: (course.Type === 'TD' || course.Type === 'TP') && course.Id === -1
      });
      if (Array.isArray(data)) {
        setCours([...cours, ...data]);
      } else {
        setCours([...cours, data]);
      }
      // Trigger refresh for CalendarPoolSelection
      setPoolRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error('Failed to add the course', error);
    }
  }

  function getMonday(date: Date): Date {
    // Create a new Date to avoid mutating the original
    const d = new Date(date);
    const day = d.getDay();
    // If already Monday (day === 1), return d as-is.
    if (day === 1) return d;
    // Else, calculate last Monday.
    const diff = (day + 6) % 7; // 0 for Monday, else number of days to subtract
    d.setDate(d.getDate() - diff);
    return d;
  }

  // Update navigation functions to use updateDate instead of setDefaultDate directly
  const nextWeek = () => {
    console.log("oldDate:", defaultDate);
    const newDate = getMonday(defaultDate);
    console.log("old date after getMonday:", newDate);
    newDate.setDate(newDate.getDate() + 7);
    console.log("oldDate, newDate:", defaultDate, newDate);
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

  // New placeholder functions for Raccourcis updated to use updateDate
  const goToFirstWeek = () => {
    if (trammeData) updateDate(getMonday(new Date(trammeData.StartDate)));
  }

  const goToLastWeek = () => {
    if (trammeData) updateDate(getMonday(new Date(trammeData.EndDate)));
  }

  async function duplicate() {
    setIsLoading(true);
    try {
      api.delete("/trammes/clear-courses/" + trammeId);
      let newDate = await api.post(`/trammes/duplicate/${trammeId}`);
      newDate = new Date(newDate);
      if (newDate.getDay() !== 1) {
        newDate = getMonday(newDate);
      }
      setDefaultDate(newDate);
      setIsLoading(false);
    } catch (error) {
      console.error("Error duplicating tramme:", error);
      setIsLoading(false);

    }
  }

  async function delcours() {
    try {
      api.delete("/trammes/clear-courses/" + trammeId);
      // Trigger refresh for CalendarPoolSelection
    } catch (error) {
      console.error("Error deleting tramme:", error);
    }
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

  function calculateEndTime(startHour: string, length: number): string {
    const [hours, minutes] = startHour.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours);
    endDate.setMinutes(minutes + length * 60);
    endDate.setSeconds(0); // Reset seconds to 0 (maybe i don't understand correctly length)
    return endDate.toTimeString().split(' ')[0];
  }

  const handleExportWeeks = async () => {
    if (!trammeData) {
      alert('No tramme data found.');
      return;
    }
    const duplicateStart = new Date(trammeData.StartDate);
    const duplicateEnd = new Date(trammeData.EndDate);
    if (duplicateStart && duplicateEnd) {
      const weeks = await fetchClassesForPeriod(getMonday(new Date(duplicateStart)), getMonday(new Date(duplicateEnd)));
      generateExcel(weeks);
    } else {
      alert('Please select both start and end weeks.');
    }
  };

  const generateExcel = (weeks: any[]) => {
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
          if (!ueSheets[course.UEName][course.Type][timeSlot]) {
            ueSheets[course.UEName][course.Type][timeSlot] = {};
          }
          if (!ueSheets[course.UEName][course.Type][timeSlot][dayIndex]) {
            ueSheets[course.UEName][course.Type][timeSlot][dayIndex] = {
              prof: course.ProfFullName || 'ZZ',
              groups: course.Groups.map((group: any) => group.Name).join(', '),
              weeks: Array(weeks.length).fill(false)
            };
          }
          ueSheets[course.UEName][course.Type][timeSlot][dayIndex].weeks[weekIndex] = true;
        });
      });
    });

    const daysInFrench = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    Object.keys(ueSheets).forEach(ueName => {
      const ue = Object.values(ues).flat().find((ue: UE) => ue.Name === ueName);
      const worksheetData = [
        ["Mention", layers.find(layer => layer.Id === currentLayerId)?.Name],
        ["Parcours", trammeName || ""],
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
          const info = ueSheets[ueName].CM[timeSlot][dayIndex];
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

      worksheetData.push([]);
      worksheetData.push(["Travaux Dirigés (TD)"]);
      worksheetData.push(["Jour", "Créneau", "Créneau non classique", "Enseignant", "Groupe/série", "Effectif", "Salle", ...weeks.map((_, index) => {
        const weekStartDate = new Date(duplicateStart);
        weekStartDate.setDate(weekStartDate.getDate() + (index * 7));
        return `S${36 + index} ${weekStartDate.toLocaleDateString('fr-FR')}`;
      })]);

      Object.keys(ueSheets[ueName].TD).forEach(timeSlot => {
        Object.keys(ueSheets[ueName].TD[timeSlot]).forEach(dayIndex => {
          const info = ueSheets[ueName].TD[timeSlot][dayIndex];
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

      worksheetData.push([]);
      worksheetData.push(["Travaux Pratiques (TP)"]);
      worksheetData.push(["Jour", "Créneau", "Créneau non classique", "Enseignant", "Groupe/série", "Effectif", "Salle", ...weeks.map((_, index) => {
        const weekStartDate = new Date(duplicateStart);
        weekStartDate.setDate(weekStartDate.getDate() + (index * 7));
        return `S${36 + index} ${weekStartDate.toLocaleDateString('fr-FR')}`;
      })]);

      Object.keys(ueSheets[ueName].TP).forEach(timeSlot => {
        Object.keys(ueSheets[ueName].TP[timeSlot]).forEach(dayIndex => {
          const info = ueSheets[ueName].TP[timeSlot][dayIndex];
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

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, ueName);
    });

    // Generate Excel file
    XLSX.writeFile(workbook, trammeName + "-" + layers.find(layer => layer.Id === currentLayerId)?.Name + '.xlsx');
  };

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

  useEffect(() => {
    fetchClassesForWeek(defaultDate).then(classes => {
      setCours(classes.flat());
      console.log("classes:", classes);
    });
  }, [defaultDate, currentLayerId]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Add a useEffect that listens to searchParams changes (e.g., via browser navigation)
  useEffect(() => {
    const param = searchParams.get("date");
    if (param) {
      setDefaultDate(getMonday(new Date(param)));
    } else {
      // Ensure fallback default date is a Monday.
      setDefaultDate(getMonday(new Date('2001-01-01')));
    }
  }, [searchParams]);
  const layerColors = layers.map((layer) => layer.Color);
  if (isLoading) {
    return <LoadingAnimation colors={layerColors}/>;
  }

  return (
    <div className="w-screen h-screen bg-gray-200  pt-8"
      onMouseUp={() => { setCurrentCours(null) }}>

      <div className='flex justify-around items-start relative mt-16'>
        {defaultDate.getTime() === new Date('2001-01-01').getTime() ? <CalendarCoursSelection setCurrentCours={setCurrentCours} ecus={currentLayerId ? ues[currentLayerId] : [{ Name: "No currentLayerId" }]} /> : <CalendarPoolSelection setCurrentCours={setCurrentCours} layerId={currentLayerId || -1} refreshTrigger={poolRefreshCounter} />}
        <div className='flex flex-col'>
          <CalendarLayerSelection layers={layers} setLayers={setLayers} onClick={(id: number) => setCurrentLayerId(id)} currentLayerId={currentLayerId || -1} />
          <CalendarFrame setPoolRefreshCounter={setPoolRefreshCounter} setCurrentCours={setCurrentCours} currentCours={currentCours} AddCours={AddCours} fetchedCourse={cours} setCours={setCours} trammeId={trammeId} date={defaultDate} color={currentLayerId ? layers.find(layer => layer.Id === currentLayerId)?.Color || "#ffffff" : "#ffffff"} />
        </div>
      </div>
      {
        currentCours &&
        <div className="absolute z-[100] -translate-x-1/2 translate-y-1/2 text-black text-xl w-80" style={{ top: `${mousePosition.y}px`, left: `${mousePosition.x}px` }}>
          <EcuItem darken={false} type={currentCours.Type} ueID={currentCours.UEId} onHover={() => { }} onLeave={() => { }} onMouseDown={() => { }} />
        </div>
      }
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
  )
}

export default CalendarPage