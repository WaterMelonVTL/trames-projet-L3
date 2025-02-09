import React, { useState, useEffect } from 'react'
import CalendarFrame from './CalendarFrame'
import CalendarCoursSelection from './CalendarCoursSelection'
import EcuItem from './EcuItem';
import { Course, UE, Layer } from '../types/types';
import { useLocation } from 'react-router-dom';
import CalendarLayerSelection from './CalendarLayerSelection';

function CalendarPage() {
  //TODO: Keep the cours data when dragging, make it use an other type that can keep it.
  const [currentCours, setCurrentEcu] = useState<Course | null>(null);
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
        const trammeResponse = await fetch(`http://localhost:3000/api/trammes/${trammeId}`);
        if (trammeResponse.ok) {
          const trammeData = await trammeResponse.json();
          const contextId = trammeData.ContextId;
          console.log(trammeData)
          setContextId(contextId);
          setTrammeName(trammeData.Name);
          console.log("contextId:", contextId);

          const layersResponse = await fetch(`http://localhost:3000/api/layers/tramme/${trammeId}`);
          if (layersResponse.ok) {
            const layersData = await layersResponse.json();
            setLayers(layersData);
            setCurrentLayerId(layersData[0].Id);

            const uesResponse = await fetch(`http://localhost:3000/api/ues/tramme/${trammeId}`);
            if (uesResponse.ok) {
              const uesData = await uesResponse.json();
              console.log("uesData:", uesData);
              const uesByLayer = layersData.reduce((acc: { [key: string]: UE[] | number[] }, layer: Layer) => { //Des fois typescript me donne envie de me jetter d'un pont (autocompleté par copilot mdr) 
                acc[layer.Id] = uesData.filter((ue: UE) => ue.LayerId === layer.Id);
                return acc;
              }, {} as { [key: string]: UE[] | number[] });
              setUes(uesByLayer);
            } else {
              console.error("Error fetching UEs:", uesResponse.statusText);
            }
          } else {
            console.error("Error fetching layers:", layersResponse.statusText);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [trammeId]);

  async function AddCours(course: Course, date: string, time: string, groups?: number[]) {
    console.log("called add cours");
    if (!groups) {
      groups = await fetch(`http://localhost:3000/api/groups/layer/${currentLayerId}?onlyDefault=true`)
        .then(res => res.json())
        .then(data => data.map((group: { Id: number }) => group.Id));
    }
    if (!groups) {
      console.error("No groups found for layer:", currentLayerId);
      return;
    }
    await fetch(`http://localhost:3000/api/cours/`,
      {
        method: 'POST',
        body: JSON.stringify(
          {
            course: {
              'UEId': course.UEId,
              'Type': course.Type,
              'Date': date,
              'StartHour': time,
              'length': course.length,

            }, groups: groups
          }),
        headers: { 'Content-Type': 'application/json' }
      })
      .then(response => {
        if (response.ok) {
          fetch(`http://localhost:3000/api/cours/date/${trammeId}/${currentLayerId}/${date}`)
            .then(res => res.json())

            .then(data => setCours([...cours, data[data.length - 1]]));
        } else {
          console.error('Failed to add the course');
        }
      })
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
      const response = await fetch(`http://localhost:3000/api/cours/date/${trammeId}/${currentLayerId}/${date.toISOString().split('T')[0]}`);
      const dayClasses = await response.json();
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
      onMouseUp={() => { setCurrentEcu(null) }}>

      <div className='flex justify-around items-start relative mt-16'>
        <CalendarCoursSelection setCurrentEcu={setCurrentEcu} ecus={currentLayerId ? ues[currentLayerId] : [{Name:"No currentLayerId"}]} />
        <div className='flex flex-col'>
          <CalendarLayerSelection layers={layers} setLayers={setLayers} onClick={(id: number) => setCurrentLayerId(id)} currentLayerId={currentLayerId || -1} />
          <CalendarFrame setCurrentEcu={setCurrentEcu} currentCours={currentCours} AddCours={AddCours} fetchedCourse={cours} setCours={setCours} trammeId={trammeId} date={defaultDate} color={currentLayerId ? layers.find(layer => layer.Id === currentLayerId)?.Color || "#ffffff" : "#ffffff"}/>
          
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