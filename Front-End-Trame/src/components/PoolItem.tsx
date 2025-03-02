import React from 'react';
import { UE, Course, CoursePool } from '../types/types';

function PoolItem(props: { darken: boolean, type: string, PoolItem: CoursePool, onHover: () => void, onLeave: () => void, setHoveredItem: (index:number) => void, setCurrentCours: (ecu: Course | null) => void }) {

  // Compute background style based on remaining hours (Volume)
  const backgroundStyle = (() => {
    if (props.PoolItem.Volume === 0) {
      return { background: "repeating-linear-gradient(45deg, #cccccc, #cccccc 10px, #e6e6e6 10px, #e6e6e6 20px)" };
    } else if (props.PoolItem.Volume < 0) {
      return { background: "repeating-linear-gradient(45deg, #ffcccc, #ffcccc 10px, #ffe6e6 10px, #ffe6e6 20px)" };
    } else {
      return { background: !props.darken ? props.PoolItem.UE?.Color : darkenColor(props.PoolItem.UE.Color, 0.2) };
    }
  })();

  return (
    <div className='w-full h-12 rounded-md shadow-sm flex select-none items-center justify-between p-4 mb-4 border border-gray-300 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:bg-opacity-90'
      style={backgroundStyle}
      onMouseEnter={props.onHover}
      onMouseLeave={props.onLeave}
      onMouseDown={() => {
        props.setCurrentCours({
          Id: -1,
          UEId: props.PoolItem.UE.Id,
          Date: new Date(),
          StartHour: '08:00',
          length: 1.5,
          Type: props.type,
          TrammeId: -1,
          LayerId: -1,
        });
        props.setHoveredItem(-1);
      }}
    >
      <h1 className='text-xl'>
        {props.PoolItem.UE.Name} ({props.type}) - {props.PoolItem.Volume}/{props.type === "CM" ? props.PoolItem.UE.TotalHourVolume_CM : props.type === "TD" ? props.PoolItem.UE.TotalHourVolume_TD : props.PoolItem.UE.TotalHourVolume_TP}
      </h1>
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

export default PoolItem;