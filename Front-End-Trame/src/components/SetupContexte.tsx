import React, { useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { Prof, Room } from '../types/types';
function SetupContexte() {
    const navigate = useNavigate();
    const location = useLocation();
    const contextID = location.pathname.split('/').pop();
    const [contextName, setContextName] = React.useState<string>('');
    const [setupStage, setSetupStage] = React.useState<number>(1);
    const [profs, setProfs] = React.useState<Prof[]>([]);
    const [profFullNameInput, setProfFullNameInput] = React.useState<string>('');
    const [profGenreInput, setProfGenreInput] = React.useState<string>('M');
    const [profStatusInput, setProfStatusInput] = React.useState<string>('');
    const [salles, setSalles] = React.useState<Room[]>([]);
    const [salleNameInput, setSalleNameInput] = React.useState<string>('');
    const [salleInformatiséeInput, setSalleInformatiséeInput] = React.useState<boolean>(false);
    const [isAmphi, setIsAmphi] = React.useState<boolean>(false);
    const [salleCapacityInput, setSalleCapacityInput] = React.useState<number | undefined>(undefined);
    const [isFileValid, setIsFileValid] = React.useState<boolean>(false);
    const [fileData, setFileData] = React.useState<any[]>([]);
    const [selectedFullName, setSelectedFullName] = React.useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          console.log(file);
        }
      };
      
      const handleFileUpload = () => {
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        const file = fileInput.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
            const requiredColumn = 'FullName';
            const firstRow = jsonData[0] as string[];
            const isValid = firstRow.includes(requiredColumn);
      
            if (isValid) {
              console.log('File is valid');
              setIsFileValid(true);
      
              const processedData = jsonData.slice(1)
                .flatMap((row: any) => {
                    const fullNames = row[firstRow.indexOf('FullName')];
                    return fullNames ? fullNames.split('/').map((name: string) => name.trim()) : [];
                })
                .filter((fullName: string) => fullName && fullName.trim().length > 0);
      
              setFileData(processedData);
              console.log('Processed Data:', processedData);
            } else {
              console.error('File is invalid. Missing required column.');
              setIsFileValid(false);
            }
          };
          reader.readAsArrayBuffer(file);
        }
      };


      const handleFullNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFullName(e.target.value);
        setProfFullNameInput(e.target.value);
      };
      
      const resetFileState = () => {
        setIsFileValid(false);
        setFileData([]);
        setSelectedFullName('');
      };

    const addProf = async () => {
        if (contextID === '' || profFullNameInput === '' || profGenreInput === '' || profStatusInput === '') return;
        const newProf = {
          FullName: profFullNameInput,
          Sexe: profGenreInput,
          Status: profStatusInput,
          ContextId: contextID 
        };
      
        console.log(newProf);
        const response = await fetch('http://localhost:3000/api/profs/', {
          method: 'POST',
          body: JSON.stringify({ prof: newProf, user: { userId: 1 } }),
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            const addedProf = await response.json();
            setProfs([...profs, addedProf]);
        } else {
            console.error('Failed to add prof');
        }   

        setProfFullNameInput('');
        setProfGenreInput('M');
        setProfStatusInput('');
    };

    const removeProf = async (index: number) => {
        await fetch(`http://localhost:3000/api/profs/${profs[index].Id}`, { method: 'DELETE' });
        setProfs(profs.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const contextResponse = await fetch(`http://localhost:3000/api/contexts/${contextID}`);
                if (contextResponse.ok) {
                    const contextData = await contextResponse.json();
                    setContextName(contextData.Name);
                } else {
                    console.error('Failed to fetch context');
                    alert('Failed to fetch context');
                    return;
                }
    
                const roomsResponse = await fetch(`http://localhost:3000/api/rooms/context/${contextID}`);
                const roomsData = await roomsResponse.json();
                setSalles(roomsData);
    
                const profsResponse = await fetch(`http://localhost:3000/api/profs/context/${contextID}`);
                const profsData = await profsResponse.json();
                setProfs(profsData);

                
            } catch (error) {
                console.error('An error has occured:', error);
                alert('An error has occured : '+ error);
                
            }
        };
    
        fetchData();
    }, [contextID]);

    const addSalle = async () => {
        if (salleNameInput === '') return;
        const newSalle = {
            Name: salleNameInput,
            Informatised: salleInformatiséeInput,
            Capacity: salleCapacityInput,
            Amphiteatre: isAmphi,
            ContextId: contextID
        };
        
        const response = await fetch('http://localhost:3000/api/rooms', { 
            method: 'POST', 
            body: JSON.stringify({ room: newSalle, user: { userId: 1 } }), 
            headers: { 'Content-Type': 'application/json' } 
        });

        if (response.ok) {
            const addedSalle = await response.json();
            setSalles([...salles, addedSalle]);
        } else {
            console.error('Failed to add salle');
        }
        setSalleNameInput('');
        setSalleCapacityInput(undefined);
    };

    const removeSalle = async (index: number) => {
        await fetch(`/api/rooms/${salles[index].Id}`, { method: 'DELETE' });
        setSalles(salles.filter((_, i) => i !== index));
    };

    const setContextNameHandler = async (name: string) => {
        const response = await fetch(`http://localhost:3000/api/contexts/${contextID}`, { 
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ Name: name }) 
        });
        if (response.ok) {
            setContextName(name);
        } else {
            console.error('Failed to set context name');
        }
    };

    useEffect(() => {
        if (setupStage === 5) {
            navigate('/');
        }
    }, [setupStage]);

    const disableNextButton = () => {
        if (setupStage === 1 && contextName === '') return true;
        if (setupStage === 2 && profs.length === 0) return true;
        if (setupStage === 3 && salles.length === 0) return true;
        return false;
    };

    return (
        <div className='flex flex-col items-center justify-center h-screen'>
            <h1 className='font-bold mb-8 text-2xl '>Veuillez définir les données à utiliser dans le contexte</h1>
            <div className='flex items-center justify-around mb-8'>
                <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${setupStage === 1 ? 'bg-blue-500 text-white' : setupStage > 1 ? 'bg-white border-4 border-blue-400 text-blue-400' : 'bg-gray-500 text-white'}`}>
                    1
                </div>
                <h1 className={`font-bold text-2xl ml-2 mr-8 ${setupStage === 1 ? 'text-black' : setupStage > 1 ? 'text-blue-400' : 'text-gray-400'}`}> Nom </h1>
                <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${setupStage === 2 ? 'bg-blue-500 text-white' : setupStage > 2 ? 'bg-white border-4 border-blue-400 text-blue-400' : 'bg-gray-500 text-white'}`}>
                    2
                </div>
                <h1 className={`font-bold text-2xl ml-2 mr-8 ${setupStage === 2 ? 'text-black' : setupStage > 2 ? 'text-blue-400' : 'text-gray-400'}`}> Profs </h1>
                <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${setupStage >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}`}>
                    3
                </div>
                <h1 className={`font-bold text-2xl ml-2 mr-8 ${setupStage >= 3 ? 'text-black' : 'text-gray-400'}`}> Salles </h1>
            </div>
            {setupStage === 1 && (
                <>
                    <h1 className='font-bold text-xl mb-4'>Veuillez définir le nom du contexte</h1>
                    <input
                        type="text"
                        className='border-b-2 border-black select-none outline-none p-2 mb-4'
                        value={contextName}
                        onChange={(e) => setContextNameHandler(e.target.value)}
                    />
                </>
            )}
 {setupStage === 2 && (
  <>
    <h1 className='font-bold text-xl mb-4'>Ajoutez de nouveaux profs</h1>
    {!isFileValid && (
      <div className='flex items-center justify-between mb-4'>
        <label htmlFor="fileInput" className='text-xl font-semibold'>Ajouter en masse via un fichier : </label>
        <input
          type="file"
          id="fileInput"
          className='border-b-2 border-black select-none outline-none p-2'
          onChange={handleFileChange}
        />
        <button
          className='bg-blue-500 text-white p-2 rounded ml-4'
          onClick={handleFileUpload}
        >
          Upload
        </button>
      </div>
    )}
    {isFileValid && (
      <div className='flex items-center justify-between mb-4'>
        <label htmlFor="fullNameSelect" className='text-xl font-semibold'>Sélectionner un nom complet : </label>
        <select
          id="fullNameSelect"
          className='border-b-2 border-black select-none outline-none p-2'
          value={selectedFullName}
          onChange={handleFullNameChange}
        >
          <option value="">Sélectionner un nom complet</option>
          {fileData.map((fullName, index) => (
            <option key={index} value={fullName}>{fullName}</option>
          ))}
        </select>
        <button
          className='bg-red-500 text-white p-2 rounded ml-4'
          onClick={resetFileState}
        >
          Changer de fichier
        </button>
      </div>
    )}
    <div className='flex flex-col mb-4'>
      <input
        type="text"
        placeholder="FullName"
        className='border-b-2 border-black select-none outline-none p-2 mb-2'
        value={profFullNameInput}
        onChange={(e) => setProfFullNameInput(e.target.value)}
      />
      <div className='flex items-center mb-2'>
            <label className='mr-2'>Genre:</label>
            <input
                type="checkbox"
                checked={profGenreInput === 'M'}
                onChange={() => setProfGenreInput(profGenreInput === 'M' ? 'F' : 'M')}
            />
            <span className='ml-2'>{profGenreInput}</span>
      </div>
      <select
        className='border-b-2 border-black select-none outline-none p-2 mb-2'
        value={profStatusInput}
        onChange={(e) => setProfStatusInput(e.target.value)}
      >
        <option value="">Select Status</option>
        <option value="Permanent">Permanent</option>
        <option value="Contract">Contract</option>
      </select>
      <button className='h-8 w-16 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-700 transition-all duration-300 hover:scale-105' onClick={addProf}>+</button>
    </div>
    {profs.length > 0 && (
      <div>
        {profs.map((prof, index) => (
          <div className='flex items-center justify-between border-2 border-black p-2 mb-2 rounded-xl' key={index}>
            <p className='ml-4'>{`${prof.FullName} (${prof.Sexe})`}</p>
            <button className='mr-4' onClick={() => removeProf(index)}>X</button>
          </div>
        ))}
      </div>
    )}
  </>
)}
            {setupStage === 3 && (
                <>
                    <h1 className='text-xl font-semibold mb-4'>Ajoutez de nouvelles salles</h1>
                    <div className='flex flex-col mb-4'>
                        <input
                            type="text"
                            placeholder="Salle Name"
                            className='border-b-2 border-black select-none outline-none p-2 mb-2'
                            value={salleNameInput}
                            onChange={(e) => setSalleNameInput(e.target.value)}
                        />
                        <div className='flex items-center mb-2'>
                            <label className='mr-2'>Informatisée:</label>
                            <input
                                type="checkbox"
                                checked={salleInformatiséeInput}
                                onChange={() => setSalleInformatiséeInput(!salleInformatiséeInput)}
                            />
                        </div>
                        <div className='flex items-center mb-2'>
                            <label className='mr-2'>Amphiteatre:</label>
                            <input
                                type="checkbox"
                                checked={isAmphi}
                                onChange={() => setIsAmphi(!isAmphi)}
                            />
                        </div>
                        <input
                            type="number"
                            placeholder="Capacity (optional)"
                            className='border-b-2 border-black select-none outline-none p-2 mb-2'
                            value={salleCapacityInput || ''}
                            onChange={(e) => setSalleCapacityInput(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                        <button className='h-8 w-16 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-700 transition-all duration-300 hover:scale-105' onClick={addSalle}>+</button>
                    </div>
                    {salles.length > 0 && (
                        <div>
                            {salles.map((salle, index) => (
                                <div className='flex items-center justify-between border-2 border-black p-2 mb-2 rounded-xl' key={index}>
                                    <p className='ml-4'>{`${salle.Name} - ${salle.Informatised ? 'I' : 'N/A'} - ${salle.Capacity || 'No Capacity'}`}</p>
                                    <button className='mr-4' onClick={() => removeSalle(index)}>X</button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
            {setupStage === 4 && <h1 className='text-xl font-semibold mb-4'>Tout est prêt!</h1>}
            <div className='flex items-center justify-between w-80 mt-8'>
                <button className='h-12 w-32 bg-gray-300 text-gray-600 disabled:cursor-not-allowed disabled:text-white disabled:hover:scale-100 disabled:hover:bg-gray-300 font-bold rounded-md hover:bg-gray-500 transition-all duration-300 hover:scale-105' disabled={setupStage === 1} onClick={() => setSetupStage(setupStage - 1)}>
                    Précédent
                </button>
                <button className='h-12 w-32 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-700 disabled:text-white disabled:hover:scale-100 disabled:hover:bg-gray-300 disabled:bg-gray-300 transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed' disabled={disableNextButton()} onClick={() => setSetupStage(setupStage + 1)}>
                    Suivant
                </button>
            </div>
        </div>
    );
}

export default SetupContexte;
