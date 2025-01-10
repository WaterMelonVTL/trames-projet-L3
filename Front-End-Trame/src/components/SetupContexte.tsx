import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Prof, Room } from '../types/types';
function SetupContexte() {
    const navigate = useNavigate();
    const location = useLocation();
    const contextID = location.pathname.split('/').pop();
    const [contextName, setContextName] = React.useState<string>('');
    const [setupStage, setSetupStage] = React.useState<number>(1);
    const [profs, setProfs] = React.useState<Prof[]>([]);
    const [profFirstNameInput, setProfFirstNameInput] = React.useState<string>('');
    const [profLastNameInput, setProfLastNameInput] = React.useState<string>('');
    const [profGenreInput, setProfGenreInput] = React.useState<string>('M');
    const [profStatusInput, setProfStatusInput] = React.useState<string>('');
    const [salles, setSalles] = React.useState<Room[]>([]);
    const [salleNameInput, setSalleNameInput] = React.useState<string>('');
    const [salleInformatiséeInput, setSalleInformatiséeInput] = React.useState<boolean>(false);
    const [isAmphi, setIsAmphi] = React.useState<boolean>(false);
    const [salleCapacityInput, setSalleCapacityInput] = React.useState<number | undefined>(undefined);

    const addProf = async () => {
        if (contextID ==='' || profFirstNameInput === '' || profLastNameInput === '' || profGenreInput === '' || profStatusInput === '') return;
        const newProf = {
            FirstName: profFirstNameInput,
            LastName: profLastNameInput,
            Sexe: profGenreInput,
            Status: profStatusInput,
            ContextId: contextID 
        };

        console.log(newProf);

        const response = await fetch('http://localhost:3000/api/profs/', { method: 'POST', body: JSON.stringify({ prof: newProf, user: { userId: 1 } }), headers: { 'Content-Type': 'application/json' } });
        if (response.ok) {
            const addedProf = await response.json();
            setProfs([...profs, addedProf]);
        } else {
            console.error('Failed to add prof');
        }   
        setProfFirstNameInput('');
        setProfLastNameInput('');
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
        setSalleInformatiséeInput(false);
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
                    <div className='flex flex-col mb-4'>
                        <input
                            type="text"
                            placeholder="First Name"
                            className='border-b-2 border-black select-none outline-none p-2 mb-2'
                            value={profFirstNameInput}
                            onChange={(e) => setProfFirstNameInput(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Last Name"
                            className='border-b-2 border-black select-none outline-none p-2 mb-2'
                            value={profLastNameInput}
                            onChange={(e) => setProfLastNameInput(e.target.value)}
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
                                    <p className='ml-4'>{`${prof.FirstName} ${prof.LastName} (${prof.Sexe})`}</p>
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
