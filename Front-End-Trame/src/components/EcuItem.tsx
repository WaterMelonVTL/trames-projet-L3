import React from 'react';

type ECU = {
  name: string,
  numberOfCM: number,
  numberOfTD: number,
  enseignantCM: string,
  enseignantTD: string[],
  color: string,
  AmphiParDefaut: string,
  TDParDefaut: string
};

function EcuItem(props: { darken: boolean, type: string, ecu: ECU, onHover: () => void, onLeave: () => void , onMouseDown: ()=> void} ) {
  const ecu = props.ecu;

  return (
    <div className='w-[90%] h-12 rounded-md shadow-md flex select-none items-center justify-between p-4 mb-4 border-2 border-black cursor-pointer transition-colors duration-300 hover:shadow-lg hover:scale-105'
      style={{ backgroundColor: !props.darken ? ecu.color : darkenColor(ecu.color, 0.2) }}
      onMouseEnter={props.onHover}
      onMouseLeave={props.onLeave}
      onMouseDown={props.onMouseDown}
    >
      <h1 className='text-xl'>{ecu.name} ({props.type})</h1>
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