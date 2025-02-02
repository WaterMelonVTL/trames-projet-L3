import { useState, useRef, useEffect } from "react";
import CalendarOptionMenu from "./CalendarOptionMenu";
import { Course, Prof, Room, UE } from "../types/types";

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






function CoursItem(props: { cours: Course, onMouseDown: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void, créneau: { start: string, end: string } }): JSX.Element {
  const [ue, setUe] = useState<UE | null>(null);
  const [prof, setProf] = useState<Prof | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
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

  useEffect(() => {
    const fetchUE = async () => {
      const response = await fetch(`http://localhost:3000/api/ues/${props.cours.UEId}`);
      const data = await response.json();
      setUe(data);
    }
    const fetchProf = async () => {
      const response = await fetch(`http://localhost:3000/api/profs/${props.cours.ProfId}`);
      const data = await response.json();
      setProf(data);
    }
    const fetchRoom = async () => {
      const response = await fetch(`http://localhost:3000/api/rooms/${props.cours.RoomId}`);
      const data = await response.json();
      setRoom(data);
    }
    fetchUE();
    fetchProf();
    fetchRoom();

  }, []);

  useEffect(() => {
    if (ue) {
      const luminance = calculateLuminance(ue.Color);
      setLuminance(luminance);
      setTextColor(luminance > 0.5 ? 'black' : 'white');
    }
  }, [ue]);

  function offsetToPercentage(offset: number): number {
    return offset/timeRatio * 100;
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

  if (!ue) {
    return <div>Loading...</div>
  } else


  return (
    <div
      ref={itemRef}
      className={`text-${textColor} h-28 border border-black hover:bg-blue-300 absolute cursor-pointer flex flex-col w-full text-center z-50`}
      style={{ backgroundColor: ue.Color, height: `${props.cours.length/timeRatio * 100}%`, transform: `translateY(${offsetToPercentage(offsetInHours)}%)` }}
      onClick={() => { console.log(`vous avez clické sur ${ue.Name} ${props.cours.Date} ${ue.Color}`) }}
      onMouseDown={(e) => { if (!showOption) { props.onMouseDown(e) } }}
      onContextMenu={handleContextMenu} >
      <h1 className="text-xl font-bold">{ue.Name}</h1>
      <h1 className="text-xl ">{prof?.FullName}</h1>
      <h1 className="text-xl ">{room?.Name}</h1>
      {
        showOption && <CalendarOptionMenu ue={ue} setUe={setUe} close={() => setShowOption(false)} position={menuPosition}/>
      }
    </div>
  )
}



export default CoursItem