import React, { useState, useEffect } from 'react'
import CalendarFrame from './CalendarFrame'
import CalendarCoursSelection from './CalendarCoursSelection'
import EcuItem from './EcuItem';
import { Course, UE, Layer } from '../types/types';
import { useLocation } from 'react-router-dom';

function CalendarPage() {
  //TODO: Keep the cours data when dragging, make it use an other type that can keep it.
  const [currentCours, setCurrentEcu] = useState<Course | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const location = useLocation();
  const trammeId = location.pathname.split('/').pop();
  const [contextId, setContextId] = useState<number | null>(null);
  const [trammeName, setTrammeName] = useState<string | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [currentLayerId, setCurrentLayerId] = useState<number | null>(null);
  const [ues, setUes] = React.useState<{ [key: number]: UE[] }>({})



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

  async function AddCours(cours: Course, date: string, time: string) {
    await fetch(`http://localhost:3000/api/cours/`,
      {
        method: 'POST',
        body: JSON.stringify(
          {
            course: {
              'UEId': cours.UEId,
              'Type': cours.Type,
              'Date': date,
              'StartHour': time,
              'TrammeId': trammeId,
              'LayerId': currentLayerId,
              'ProfId': cours.ProfId,
              'length': cours.length,
              'RoomId': cours.RoomId // à remplacer par la fonction qui trouve la salle libre en fonction de l'heure et du type de cours

            }, user: { Id: 1 }
          }),
        headers: { 'Content-Type': 'application/json' }
      })
  }



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
    <div className="w-screen h-screen bg-gray-200 flex justify-around items-start pt-8"
      onMouseUp={() => { setCurrentEcu(null) }}>

      [<CalendarCoursSelection setCurrentEcu={setCurrentEcu} ecus={currentLayerId ? ues[currentLayerId] : []} />]
      <CalendarFrame setCurrentEcu={setCurrentEcu} currentCours={currentCours} AddCours={AddCours} />
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