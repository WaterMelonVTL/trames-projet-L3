import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { Prof } from '../types/types';

function SetupContexte() {
    const navigate = useNavigate();
    const location = useLocation();
    const contextID = location.pathname.split('/').pop();
    const [contextName, setContextName] = useState<string>('');
    const [setupStage, setSetupStage] = useState<number>(1);
    const [profs, setProfs] = useState<Prof[]>([]);
    const [profFullNameInput, setProfFullNameInput] = useState<string>('');
    const [profStatusInput, setProfStatusInput] = useState<string>('');
    // Removed room-related states
    const [isFileValid, setIsFileValid] = useState<boolean>(false);
    const [fileData, setFileData] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filteredProfs, setFilteredProfs] = useState<string[]>([]);
    const [selectedProfs, setSelectedProfs] = useState<string[]>([]);
    const lastChecked = useRef<number | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          console.log(file);
        }
    };
      
    const handleFileUpload = async () => {
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        const file = fileInput.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
            const requiredColumns = [
              'Code UE',
              'Libellé long',
              'Effectifs 21-22',
              'Nb Heures - CM',
              'Nb Heures - TD',
              'Nb Heures - TP',
              'Nb Heures - terrain',
              'RESP_ELP'
            ];
      
            const firstRow = jsonData[0] as string[];
            console.log('First Row:', firstRow);
            console.log('Required Columns:', requiredColumns);
            const isValid = requiredColumns.every(col => firstRow.includes(col));
      
            if (isValid) {
              console.log('File is valid');
              setIsFileValid(true);
      
              const profsToAdd = new Set<string>();
      
              await Promise.all(jsonData.slice(1).map(async (row: any) => {
                const responsible = row[firstRow.indexOf('RESP_ELP')];
                if (responsible) {
                  const responsibleNames = responsible.split('/').map((name: string) => name.trim());
                  responsibleNames.forEach((name: string) => {
                    profsToAdd.add(name);
                  });
                }
              }));
      
              const validData = Array.from(profsToAdd);
              setFileData(validData);
              console.log('Processed Data:', validData);
            } else {
              console.error('File is invalid. Missing required columns.');
              setIsFileValid(false);
            }
          };
          reader.readAsArrayBuffer(file);
        }
    };

    const resetFileState = () => {
      setIsFileValid(false);
      setFileData([]);
    };

    const openModal = () => {
      setIsModalOpen(true);
      setFilteredProfs(fileData);
    };
    
    const closeModal = () => {
      setIsModalOpen(false);
      setSearchQuery('');
      setFilteredProfs([]);
    };

    const sendProfToServer = async (newProf: { FullName: string, Status: string, ContextId: string }) => {
      const response = await fetch('http://localhost:3000/api/profs/', {
        method: 'POST',
        body: JSON.stringify({ prof: newProf, user: { userId: 1 } }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to add prof:', newProf.FullName);
        return null;
      }
    };
    
    const addProfs = async (profsToAdd: string[]) => {
      const newProfs = profsToAdd.map(fullName => ({
        FullName: fullName,
        Status: 'Permanent',
        ContextId: contextID
      }));
    
      try {
        const responses = await Promise.all(newProfs.map(prof => sendProfToServer(prof)));
        const addedProfs = responses.filter(prof => prof !== null);
        setProfs([...profs, ...addedProfs]);
      } catch (error) {
        console.error('Failed to add profs:', error);
      }
    
      setSelectedProfs([]);
      closeModal();
    };

    const addSelectedProfs = () => {
      addProfs(selectedProfs);
    };
    
    const addAllFilteredProfs = () => {
      addProfs(filteredProfs);
    };

    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const fullName = filteredProfs[index];
    
      if (lastChecked.current !== null && e.nativeEvent.shiftKey) {
        setSelectedProfs((prev) => {
          const start = Math.min(lastChecked.current!, index);
          const end = Math.max(lastChecked.current!, index);
          const newSelectedProfs = [...prev];
    
          for (let i = start; i <= end; i++) {
            const name = filteredProfs[i];
            if (!newSelectedProfs.includes(name)) {
              newSelectedProfs.push(name);
            }
          }
    
          return newSelectedProfs;
        });
        return;
      }
    
      if (e.target.checked) {
        lastChecked.current = index;
        setSelectedProfs((prev) => [...prev, fullName]);
      } else {
        lastChecked.current = null;
        setSelectedProfs((prev) => prev.filter((name) => name !== fullName));
      }
    }, [filteredProfs]);

    const addProf = async () => {
      if (contextID === '' || profFullNameInput === '' || profStatusInput === '') return;
      const newProf = {
        FullName: profFullNameInput,
        Status: profStatusInput,
        ContextId: contextID
      };
    
      console.log(newProf);
      const addedProf = await sendProfToServer(newProf);
      if (addedProf) {
        setProfs([...profs, addedProf]);
      }
    
      setProfFullNameInput('');
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
    
                // Removed room fetch
                const profsResponse = await fetch(`http://localhost:3000/api/profs/context/${contextID}`);
                const profsData = await profsResponse.json();
                setProfs(profsData);
            } catch (error) {
                console.error('An error has occured:', error);
                alert('An error has occured : ' + error);
            }
        };
    
        fetchData();
    }, [contextID]);

    // Removed addSalle and removeSalle functions

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
        if (setupStage === 3) {
            navigate('/');
        }
    }, [setupStage]);

    const disableNextButton = () => {
        if (setupStage === 1 && contextName === '') return true;
        if (setupStage === 2 && profs.length === 0) return true;
        return false;
    };

    return (
        <div className='flex flex-col items-center justify-center h-screen'>
            {/* Updated progress indicator */}
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
                <h1 className={`font-bold text-2xl ml-2 ${setupStage >= 3 ? 'text-black' : 'text-gray-400'}`}> Prêt </h1>
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
                        <button
                          className='bg-green-500 text-white p-2 rounded'
                          onClick={openModal}
                        >
                          Rechercher et ajouter des profs
                        </button>
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
                      <div className='max-h-64 overflow-y-auto'>
                        {profs.map((prof, index) => (
                          <div className='flex items-center justify-between border-2 border-black p-2 mb-2 rounded-xl' key={index}>
                            <p className='ml-4'>{`${prof.FullName}`}</p>
                            <button className='mr-4' onClick={() => removeProf(index)}>X</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {isModalOpen && (
                      <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center'>
                        <div className='bg-white p-4 rounded-lg'>
                          <h2 className='text-xl font-bold mb-4'>Rechercher des profs</h2>
                          <input
                            type="text"
                            placeholder="Rechercher..."
                            className='border-b-2 border-black select-none outline-none p-2 mb-4'
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setFilteredProfs(fileData.filter(fullName => fullName.toLowerCase().includes(e.target.value.toLowerCase())));
                            }}
                          />
                          <div className='max-h-64 overflow-y-auto'>
                            {filteredProfs.map((fullName, index) => (
                              <div key={index} className='flex items-center justify-between mb-2'>
                                <input
                                  type="checkbox"
                                  checked={selectedProfs.includes(fullName)}
                                  data-index={index}
                                  onChange={(e) => handleCheckboxChange(e, index)}
                                />
                                <p className='flex-grow text-left ml-2'>{fullName}</p>
                              </div>
                            ))}
                          </div>
                          <button
                            className='bg-green-500 text-white p-2 rounded mt-4'
                            onClick={addSelectedProfs}
                          >
                            Ajouter sélectionnés
                          </button>
                          <button
                            className='bg-green-500 text-white p-2 rounded mt-4 ml-4'
                            onClick={addAllFilteredProfs}
                          >
                            Ajouter tous
                          </button>
                          <button
                            className='bg-red-500 text-white p-2 rounded mt-4 ml-4'
                            onClick={closeModal}
                          >
                            Fermer
                          </button>
                        </div>
                      </div>
                    )}
                </>
            )}
            {setupStage === 3 && <h1 className='text-xl font-semibold mb-4'>Tout est prêt!</h1>}
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
