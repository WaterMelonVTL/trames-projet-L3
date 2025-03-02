import React, { useState, useEffect } from 'react'
import CalendarFrame from './CalendarFrame'
import CalendarCoursSelection from './CalendarCoursSelection'
import EcuItem from './EcuItem';
import { Course, UE, Layer } from '../types/types';
import { useLocation } from 'react-router-dom';
import CalendarLayerSelection from './CalendarLayerSelection';
import { api } from '../public/api/api.js'; // <-- added api import
import * as XLSX from 'xlsx';

function CalendarPage() {
  //TODO: Keep the cours data when dragging, make it use an other type that can keep it.
  const [currentCours, setCurrentCours] = useState<Course | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const location = useLocation();
  const trammeId = location.pathname.split('/').pop();
  const [contextId, setContextId] = useState<number | null>(null);
  const [trammeName, setTrammeName] = useState<string | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [cours, setCours] = useState<Course[]>([]);
  const [currentLayerId, setCurrentLayerId] = useState<number | null>(null);
  const [ues, setUes] = React.useState<{ [key: number]: UE[] }>({})

  const [defaultDate, setDefaultDate] = useState<Date>(new Date('2001-01-01')); // Starting date
  
  // New state for duplicate inputs
  const [duplicateStart, setDuplicateStart] = useState<string>('');
  const [duplicateEnd, setDuplicateEnd] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tramme data using the api
        const trammeData = await api.get(`/trammes/${trammeId}`);
        const contextId = trammeData.ContextId;
        console.log(trammeData);
        setContextId(contextId);
        setTrammeName(trammeData.Name);
        console.log("contextId:", contextId);

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
    } catch (error) {
      console.error('Failed to add the course', error);
    }
  }

  function getMonday(date: Date): Date { // will be useful later
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }
  
  const nextWeek = () => {
    const newDate = new Date(defaultDate);
    newDate.setDate(newDate.getDate() + 7);
    setDefaultDate(newDate);
  }

  const previousWeek = () => {
    const newDate = new Date(defaultDate);
    newDate.setDate(newDate.getDate() - 7);
    setDefaultDate(newDate);
  }

  const resetToBaseline = () => {
    setDefaultDate(new Date('2001-01-01'));
  }

  async function duplicate() {
    try {
      api.delete("/trammes/clear-courses/"+trammeId);
      let newDate = await api.post(`/trammes/duplicate/${trammeId}`, { 
        startDate: duplicateStart, 
        endDate: duplicateEnd, 
        daysToSkip: [] 
      });
      newDate = new Date(newDate);
      if (newDate.getDay() !== 1) {
        newDate = getMonday(newDate);
      }
      setDefaultDate(newDate);
    } catch (error) {
      console.error("Error duplicating tramme:", error);
    }
  }

  async function delcours(){
    try {
      api.delete("/trammes/clear-courses/"+trammeId);
    } catch (error) {
      console.error("Error deleting tramme:", error);
    }
  }
  
  async function fetchClassesForWeek(monday: Date) {
    const classes = [];
    for (let i = 0; i < 7; i++) {
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
    XLSX.writeFile(workbook, trammeName+"-"+layers.find(layer => layer.Id === currentLayerId)?.Name+'.xlsx');
  };

  async function fetchClassesForPeriod(startMonday: Date, endMonday: Date) {
    const weeks = [];
    let currentMonday = new Date(startMonday);
  
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

  return (
    <div className="w-screen h-screen bg-gray-200  pt-8"
      onMouseUp={() => { setCurrentCours(null) }}>

      <div className='flex justify-around items-start relative mt-16'>
        <CalendarCoursSelection setCurrentCours={setCurrentCours} ecus={currentLayerId ? ues[currentLayerId] : [{ Name: "No currentLayerId" }]} />
        <div className='flex flex-col'>
          <CalendarLayerSelection layers={layers} setLayers={setLayers} onClick={(id: number) => setCurrentLayerId(id)} currentLayerId={currentLayerId || -1} />
          <CalendarFrame setCurrentCours={setCurrentCours} currentCours={currentCours} AddCours={AddCours} fetchedCourse={cours} setCours={setCours} trammeId={trammeId} date={defaultDate} color={currentLayerId ? layers.find(layer => layer.Id === currentLayerId)?.Color || "#ffffff" : "#ffffff"} />
        </div>
      </div>
      {
        currentCours &&
        <div className="absolute z-[100] -translate-x-1/2 translate-y-1/2 text-black text-xl w-80" style={{ top: `${mousePosition.y}px`, left: `${mousePosition.x}px` }}>
          <EcuItem darken={false} type={currentCours.Type} ueID={currentCours.UEId} onHover={() => { }} onLeave={() => { }} onMouseDown={() => { }} />
        </div>
      }
      {/* Conditional rendering for control buttons */}
      <div className="mt-4">
        {defaultDate.getTime() === new Date('2001-01-01').getTime() ? (
          <div>
            <input 
              type="date" 
              value={duplicateStart} 
              onChange={(e) => setDuplicateStart(e.target.value)} 
              placeholder="Start date"
              className="border border-gray-300 rounded py-2 px-3 mr-2 mb-2" />
            <input 
              type="date" 
              value={duplicateEnd} 
              onChange={(e) => setDuplicateEnd(e.target.value)} 
              placeholder="End date"
              className="border border-gray-300 rounded py-2 px-3 mr-2 mb-2" />
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
              onClick={() => duplicate()}>
              Appliquer la semaine type
            </button>
          </div>
        ) : (
          <div>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 mr-2"
              onClick={() => resetToBaseline()}>
              Retour à la semaine type
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 mr-2"
              onClick={() => previousWeek()}>
              Semaine précédente
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 mr-2"
              onClick={() => nextWeek()}>
              Semaine suivante
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
              onClick={handleExportWeeks}>
              Export Weeks as JSON
            </button>
          </div>
        )}
        {/*<button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 mt-2"
          onClick={() => delcours()}>
          Delete all cours
        </button>*/}
      </div>
    </div>
  )
}

export default CalendarPage