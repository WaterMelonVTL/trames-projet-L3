import React, { useState, useEffect } from 'react'
import CalendarFrame from './CalendarFrame'
import CalendarCoursSelection from './CalendarCoursSelection'
import EcuItem from './EcuItem';
import { Course, UE, Layer } from '../types/types';
import { useLocation } from 'react-router-dom';
import CalendarLayerSelection from './CalendarLayerSelection';
import { api } from '../public/api/api.js'; // <-- added api import

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

  function getMonday(date: Date): Date { // will be usefull later
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(date.setDate(diff));
  }

  async function fetchClassesForWeek(monday: Date) {
    const classes = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dayClasses = await api.get(`/cours/date/${trammeId}/${currentLayerId}/${date.toISOString().split('T')[0]}`);
      classes.push(dayClasses);
    }
    return classes;
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
    </div>
  )
}

export default CalendarPage