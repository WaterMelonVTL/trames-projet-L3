import { useState, useRef, useEffect } from "react";
import CalendarOptionMenu from "./CalendarOptionMenu";
import { Course, Prof, Room, UE } from "../types/types";
import { useUE, useGroupsByCourse, useGroups } from "../hooks/useApiData.js";
import { useIsCourseLocked} from "../hooks/useCalendarData.js";
function calculateLuminance(hexColor: string): number {
  if (!hexColor) {
    return 0;
  }
  hexColor = hexColor.replace(/^#/, '');

  let r = parseInt(hexColor.substring(0, 2), 16) / 255;
  let g = parseInt(hexColor.substring(2, 4), 16) / 255;
  let b = parseInt(hexColor.substring(4, 6), 16) / 255;

  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function CoursItem(props: {
  setCours: React.Dispatch<React.SetStateAction<Course[]>>;
  cours: Course;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  créneau: { start: string, end: string }
  trammeId: string | undefined;
}): JSX.Element {
  
  // Use our centralized hooks
  const { data: ue, isLoading: isUeLoading } = useUE(props.cours.UEId);
  
  // Get all groups to match IDs with complete objects
  const { data: allGroups, isLoading: isGroupsLoading } = useGroups();
  
  // Only fetch groups if they're not already present in the course object
  const shouldFetchGroups = !props.cours.Groups && typeof props.cours.Id === 'number' && !String(props.cours.Id).startsWith('temp');
  const { data: groups } = useGroupsByCourse(shouldFetchGroups ? props.cours.Id : undefined);
  
  // Check if this course is currently being moved/processed
  const isLocked = useIsCourseLocked(props.cours.Id);
  
  const [luminance, setLuminance] = useState<number>(0);
  const [textColor, setTextColor] = useState<string>('black');
  const [timeRatio, setTimeRatio] = useState<number>(1.5);
  const [showOption, setShowOption] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.top, left: rect.right });
    }
    setShowOption(true);
  };

  // Calculate luminance and text color whenever ue data changes
  useEffect(() => {
    if (ue) {
      const calcLuminance = calculateLuminance(ue.Color);
      setLuminance(calcLuminance);
      setTextColor(calcLuminance > 0.5 ? 'black' : 'white');
    }
  }, [ue]);

  // Update course with groups only if they were successfully fetched
  useEffect(() => {
    if (groups && groups.length > 0 && shouldFetchGroups) {
      props.setCours(prevCourses => prevCourses.map(course =>
        course.Id === props.cours.Id ? { ...course, Groups: groups } : course
      ));
    }
  }, [groups, props.cours.Id, shouldFetchGroups, props.setCours]);

  // Handle positioning calculations
  function offsetToPercentage(offset: number): number {
    return offset / timeRatio * 100;
  }

  const [offset, setOffset] = useState<number>(0);
  const [offsetInHours, setOffsetInHours] = useState<number>(0);

  useEffect(() => {
    const créneauStart = props.créneau.start.split('h').reduce((acc, time, index) => acc + (index === 0 ? parseInt(time) * 60 : parseInt(time)), 0);
    const courseStart = props.cours.StartHour.split(':').reduce((acc, time, index) => acc + (index === 0 ? parseInt(time) * 60 : parseInt(time)), 0);
    const offset = courseStart - créneauStart;
    setOffset(offset);
    setOffsetInHours(offset / 60);
  }, [props.créneau.start, props.cours.StartHour]);

  if (isUeLoading || !ue) {
    return <div className=" w-full h-full bg-gray-300 animate-pulse"></div>
  }

  // Helper function to get group name
  const getGroupName = (group: any): string => {
    // Case 1: Group is a full object with a Name
    if (typeof group === 'object' && group !== null && group.Name) {
      return group.Name;
    }
    
    // Case 2: Group is an object with ID but no Name - look it up in allGroups
    if (typeof group === 'object' && group !== null && group.Id && !group.Name) {
      const groupId = String(group.Id);
      if (allGroups && allGroups.length > 0) {
        const foundGroup = allGroups.find(g => String(g.Id) === groupId);
        if (foundGroup && foundGroup.Name) {
          return foundGroup.Name;
        }
      }
    }
    
    // Case 3: Group is an ID (number/string) - look it up in allGroups
    if ((typeof group === 'number' || typeof group === 'string') && allGroups && allGroups.length > 0) {
      const groupId = String(group);
      const foundGroup = allGroups.find(g => String(g.Id) === groupId);
      if (foundGroup && foundGroup.Name) {
        return foundGroup.Name;
      }
    }
    
    // Fallback: Return ID with G- prefix
    return `G-${typeof group === 'object' && group !== null ? group.Id : group}`;
  };

  // Determine which groups data to display
  const groupsToDisplay = props.cours.Groups || groups || [];

  return (
    <div
      ref={itemRef}
      className={`text-${textColor} h-28 ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-300 cursor-pointer'} flex flex-col items-center flex-grow text-center z-50`}
      style={{ 
        backgroundColor: ue.Color, 
        height: `${props.cours.length / timeRatio * 100}%`, 
        transform: `translateY(${offsetToPercentage(offsetInHours)}%)`,
        position: 'relative' // Add this to ensure absolute positioned children work correctly
      }}
      onClick={() => { 
        if (!isLocked) console.log(`vous avez clické sur ${ue.Name} ${props.cours.Date} ${ue.Color}`) 
      }}
      onMouseDown={(e) => { 
        // Only allow drag if not locked and no context menu is shown
        if (!isLocked && !showOption) { 
          console.log(`Mouse down on course ID: ${props.cours.Id} (${typeof props.cours.Id})`);
          props.onMouseDown(e) 
        }
      }}
      onContextMenu={handleContextMenu} >
      
      {/* Show a visual indicator that the course is being processed */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
          <span className="text-white font-bold">⏳</span>
        </div>
      )}
      
      <h1 className="text-xl font-bold">{ue.Name}</h1>
      <h1 className="text-base">{props.cours.Type}</h1>
      {/* <h1 className="text-xl">{props.cours.ProfFullName}</h1> */}
      <div className="flex space-x-2">
        {groupsToDisplay.map((group, index) => (
          <h1 key={index} className="text-base">
            {getGroupName(group)}
          </h1>
        ))}
      </div>
      {showOption && (
        <CalendarOptionMenu
        key={`${props.cours.Id}-${props.cours.ProfId || 'none'}-${showOption}`}
          isOpen={showOption}
          cours={props.cours}
          setCours={props.setCours}
          close={() => setShowOption(false)}
          position={menuPosition}
          trammeId={props.trammeId}
        />
      )}


    </div>
  )
}

export default CoursItem;