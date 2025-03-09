import React, { useState } from 'react';
import { UE, Course, GroupedCoursePool } from '../types/types';

function PoolItem(props: { 
  darken: boolean, 
  type: string, 
  poolItem: GroupedCoursePool, 
  onHover: () => void, 
  onLeave: () => void, 
  setHoveredItem: (index:number) => void, 
  setCurrentCours: (ecu: Course | null) => void,
  groups: any[] // Add groups prop
}) {

  const [showGroupNames, setShowGroupNames] = useState(false);

  // Compute background style based on remaining hours (Volume)
  const backgroundStyle = (() => {
    if (props.poolItem.Volume === 0) {
      return { background: "repeating-linear-gradient(45deg, #cccccc, #cccccc 10px, #e6e6e6 10px, #e6e6e6 20px)" };
    } else if (props.poolItem.Volume < 0) {
      return { background: "repeating-linear-gradient(45deg, #ffcccc, #ffcccc 10px, #ffe6e6 10px, #ffe6e6 20px)" };
    } else {
      return { background: !props.darken ? props.poolItem.UE?.Color : darkenColor(props.poolItem.UE.Color, 0.2) };
    }
  })();

  // Create course with all associated groups
  const createCourse = () => {
    props.setCurrentCours({
      Id: -1,
      UEId: props.poolItem.UE.Id,
      Date: new Date(),
      StartHour: '08:00',
      length: 1.5,
      Type: props.type,
      TrammeId: -1,
      LayerId: -1,
      Groups: props.poolItem.GroupIds.map(id => ({ Id: id })) // Include all group IDs
    });
    props.setHoveredItem(-1);
  };

  const groupCount = props.poolItem.GroupIds.length;
  
  // Get group names from the cache
  const getGroupNames = () => {
    if (!props.groups || props.groups.length === 0) return [];
    
    return props.poolItem.GroupIds
      .map(id => props.groups.find(g => g.Id === id))
      .filter(Boolean)
      .map(group => group.Name);
  };

  const groupNames = getGroupNames();
  
  // Toggle group names display
  const toggleGroupNames = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); 
    setShowGroupNames(!showGroupNames);
  };
  
  // Check if remaining volume is 0 - keep compact view
  if (props.poolItem.Volume === 0) {
    return (
      <div 
        className='w-full h-12 rounded-md shadow-sm flex select-none items-center justify-between p-4 mb-4 border border-gray-300 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:bg-opacity-90'
        style={backgroundStyle}
        onMouseEnter={props.onHover}
        onMouseLeave={props.onLeave}
        onMouseDown={createCourse}
      >
        <h1 className='text-xl'>
          {props.poolItem.UE.Name} ({props.type}) - {props.poolItem.Volume}/{props.type === "CM" ? props.poolItem.UE.TotalHourVolume_CM : props.type === "TD" ? props.poolItem.UE.TotalHourVolume_TD : props.poolItem.UE.TotalHourVolume_TP}
          {groupCount > 1 && <span className='text-sm ml-2'>({groupCount} groupes)</span>}
        </h1>
      </div>
    );
  }

  // Enhanced layout with more space and better organization
  return (
    <div 
      className='w-full rounded-md shadow-sm flex flex-col select-none p-4 mb-4 border border-gray-300 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:bg-opacity-90'
      style={backgroundStyle}
      onMouseEnter={props.onHover}
      onMouseLeave={props.onLeave}
      onMouseDown={createCourse}
    >
      <div className="flex items-center justify-between">
        <h1 className='text-xl font-semibold'>{props.poolItem.UE.Name}</h1>
        <span className='bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm font-bold'>{props.type}</span>
      </div>
      
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center">
          <span className='font-medium'>
            Restant: {props.poolItem.Volume}/{props.type === "CM" 
              ? props.poolItem.UE.TotalHourVolume_CM 
              : props.type === "TD" 
                ? props.poolItem.UE.TotalHourVolume_TD 
                : props.poolItem.UE.TotalHourVolume_TP}h
          </span>
        </div>
        {groupCount > 0 && (
          <div className="flex flex-col items-end">
            {groupCount === 1 ? (
              // Display group name directly for a single group
              <span className='bg-white bg-opacity-20 px-2 py-1 rounded text-sm'>
                {groupNames[0] || 'Groupe inconnu'}
              </span>
            ) : (
              // For multiple groups, show dropdown toggle
              <>
                <span 
                  className='bg-white bg-opacity-20 px-2 py-1 rounded text-sm cursor-pointer hover:bg-opacity-30'
                  onClick={toggleGroupNames}
                >
                  {groupCount} groupes {showGroupNames ? '▲' : '▼'}
                </span>
                {showGroupNames && groupNames.length > 0 && (
                  <div className="mt-2 bg-white bg-opacity-20 px-2 py-1 rounded text-sm max-w-full">
                    {groupNames.map((name, idx) => (
                      <div key={idx} className="whitespace-nowrap overflow-hidden text-ellipsis">
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
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