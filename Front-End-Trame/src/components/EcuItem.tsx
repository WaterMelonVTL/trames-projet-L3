import React from 'react';
import { UE, Course } from '../types/types';
import { useState, useEffect } from 'react';

function EcuItem(props: { darken: boolean, type: string, ueID: number, onHover: () => void, onLeave: () => void, setHoveredItem: (index:number) => void , setCurrentEcu: (ecu: Course | null) => void }) {
  const [ue, setUE] = useState<UE | null>(null);
  useEffect(() => {
    fetch(`http://localhost:3000/api/ues/${props.ueID}`)
      .then(res => res.json())
      .then(data => setUE(data));
  }, [props.ueID]);

  if (ue === null) {
    return <div className='w-full h-12 rounded-md shadow-md flex select-none items-center justify-between p-4 mb-4 border-2 border-black cursor-pointer transition-colors duration-300 hover:shadow-lg hover:scale-105'
      style={{ backgroundColor: !props.darken ? '#f4f4f4' : darkenColor('#f4f4f4', 0.2) }}>

      <h1 className='text-xl'>Chargement...</h1>
    </div>;
  }
  return (
    <div className='w-full h-12 rounded-md shadow-md flex select-none items-center justify-between p-4 mb-4 border-2 border-black cursor-pointer transition-colors duration-300 hover:shadow-lg hover:scale-105'
      style={{ backgroundColor: !props.darken ? ue?.Color : darkenColor(ue.Color, 0.2) }}
      onMouseEnter={props.onHover}
      onMouseLeave={props.onLeave}
      onMouseDown={() => {
        props.setCurrentEcu({
          Id: -1,
          UEId: ue.Id,
          Date: new Date(),
          StartHour: '08:00',
          length: 1.5,
          Type: props.type,
          TrammeId: -1,
          RoomId: ue.AmphiByDefaultId, // à changer plus tard.... La salle doit etre définie par l'emploi du temps cf ADDCOURS
          LayerId: -1,
          ProfId: ue.ResponsibleId // à changer plus tard.... On peut recuperer le prof de l'ue par type dans la DB. à fetcher
        });
        props.setHoveredItem(-1);
      }}
    >
      <h1 className='text-xl'>{ue.Name} ({props.type})</h1>
    </div>
  );
}

function darkenColor(color: string, amount: number): string {
  let usePound = false;
  if (color[0] === "#") {
    color = color.slice(1);
    usePound = true;
  }

  const num = parseInt(color, 16);
  let r = (num >> 16) - amount * 255;
  let g = ((num >> 8) & 0x00FF) - amount * 255;
  let b = (num & 0x0000FF) - amount * 255;

  r = r < 0 ? 0 : r;
  g = g < 0 ? 0 : g;
  b = b < 0 ? 0 : b;

  return (usePound ? "#" : "") + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

export default EcuItem;