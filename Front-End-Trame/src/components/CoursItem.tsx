type Cours = {
  id: number,
  nom: string,
  type: string,
  enseignant: string,
  date: string,
  jour: number,
  start: number,
  salle: string,
  groupe: string[],
  offset: number,
  couleur: string,
  durée: number
}
function calculateLuminance(hexColor: string): number {

  hexColor = hexColor.replace(/^#/, '');


  let r = parseInt(hexColor.substring(0, 2), 16) / 255;
  let g = parseInt(hexColor.substring(2, 4), 16) / 255;
  let b = parseInt(hexColor.substring(4, 6), 16) / 255;

  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);


  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function offsetToPercentage(offset: number): number {
  return (offset * 60 / 90) * 100;
}

function CoursItem(props : {cours: Cours, onMouseDown:()=>void}) {
  const cours = props.cours;
  const luminance = calculateLuminance(cours.couleur);
  const textColor = luminance > 0.5 ? 'black' : 'white';
  return (

    <div className={`text-${textColor} h-28 border border-black hover:bg-blue-300 absolute cursor-pointer flex flex-col w-full text-center z-50`} 
    style={{ backgroundColor: cours.couleur, height: `${cours.durée * 100}%`, transform:`translateY(${offsetToPercentage(cours.offset)/cours.durée}%)`}} 
    onClick={()=> {console.log(`vous avez clické sur ${cours.nom} ${cours.date} ${cours.couleur}`)}} 
    onMouseDown={props.onMouseDown}
    onContextMenu={(e) => {e.preventDefault(); console.log(`right click sur ${cours.nom} ${cours.date}`)}} >
      <h1 className="text-xl font-bold">{cours.nom}</h1>
      <h1 className="text-xl ">{cours.enseignant}</h1>
      <h1 className="text-xl ">{cours.salle}</h1>
    </div>

  )

}



export default CoursItem