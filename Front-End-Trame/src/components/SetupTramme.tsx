import React, { useState, useRef, useCallback,useEffect } from 'react'
import { UE, Layer, Prof } from "../types/types";
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import randomColor from 'randomcolor';

function SetupPage() {
  const navigate = useNavigate();
  const trammeId = location.pathname.split('/').pop();

  const [contextId, setContextId] = React.useState<number>(-1)
  const [setupStage, setSetupStage] = React.useState<number>(1)

  const [layers, setCouches] = React.useState<Layer[]>([])
  const [ues, setUes] = React.useState<{ [key: number]: UE[] }>({})

  
  const [profs, setProfs] = React.useState<Prof[]>([])

  const [currentLayerIndex, setCurrentLayerIndex] = React.useState<number>(0)

  //Tramme inputs _______________________________________________________________________________________________
  const [trammeNameInput, setTrammeNameInput] = React.useState<string>('')

  //Layer inputs ________________________________________________________________________________________________
  const [layerNameInput, setLayerNameInput] = React.useState<string>('')
  const [layerColorInput, setLayerColorInput] = React.useState<string>('')


  //UE inputs ___________________________________________________________________________________________________
  const [ueProfResponsableInput, setUeProfResponsableInput] = React.useState<string>('')
  const [ueNameInput, setUeNameInput] = React.useState<string>('')
  const [ueColorInput, setUeColorInput] = React.useState<string>('')
  const [ueCMVolumeInput, setUeCMVolumeInput] = React.useState<number>(0)
  const [ueTDVolumeInput, setUeTDVolumeInput] = React.useState<number>(0)
  const [ueTPVolumeInput, setUeTPVolumeInput] = React.useState<number>(0)
 
  //_____________________________________________________________________________________________________________

  const defaultColors = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF']

  const [isFileValid, setIsFileValid] = React.useState<boolean>(false);
  const [fileData, setFileData] = React.useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [filteredUEs, setFilteredUEs] = React.useState<string[]>([]);
  const [selectedUEs, setSelectedUEs] = React.useState<string[]>([]);
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
  
          const processedData = new Map();
          await Promise.all(jsonData.slice(1).map(async (row: any) => {
            const codeUE = row[firstRow.indexOf('Code UE')];
            const responsible = row[firstRow.indexOf('RESP_ELP')];
            if (responsible) {
              const responsibleId = await getProfIdByFullName(responsible.split('/')[0].trim());
              if (responsibleId) {
                if (!processedData.has(codeUE)) { // Ligne ajoutée pour vérifier l'unicité
                  processedData.set(codeUE, {
                    'Code UE': codeUE,
                    'Nb Heures - CM': Math.round(row[firstRow.indexOf('Nb Heures - CM')]),
                    'Nb Heures - TD': Math.round(row[firstRow.indexOf('Nb Heures - TD')]),
                    'Nb Heures - TP': Math.round(row[firstRow.indexOf('Nb Heures - TP')]),
                    'ResponsibleId': responsibleId
                  });
                }
              } else {
                console.error(`Responsible ${responsible.split('/')[0].trim()} not found for UE ${codeUE}`);
              }
            }
          }));
  
          const validData = Array.from(processedData.values());
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

  const openModal = () => {
    setIsModalOpen(true);
    setFilteredUEs(fileData);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSearchQuery('');
    setFilteredUEs([]);
  };

  const resetFileState = () => {
    setIsFileValid(false);
    setFileData([]);
  };
  
  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const ueCode = filteredUEs[index]['Code UE'];
  
    if (lastChecked.current !== null && e.nativeEvent.shiftKey) {
      setSelectedUEs((prev) => {
        const start = Math.min(lastChecked.current!, index);
        const end = Math.max(lastChecked.current!, index);
        const newSelectedUEs = [...prev];
  
        for (let i = start; i <= end; i++) {
          const code = filteredUEs[i]['Code UE'];
          if (!newSelectedUEs.includes(code)) {
            newSelectedUEs.push(code);
          }
        }
  
        return newSelectedUEs;
      });
      return;
    }
  
    if (e.target.checked) {
      lastChecked.current = index;
      setSelectedUEs((prev) => [...prev, ueCode]);
    } else {
      lastChecked.current = null;
      setSelectedUEs((prev) => prev.filter((code) => code !== ueCode));
    }
  }, [filteredUEs]);

  const getProfIdByFullName = async (fullName: string) => {
    const profsData = await searchProfs(fullName);
    const prof = profsData.find((prof: Prof) => prof.FullName === fullName);
    return prof ? prof.Id : null;
  };

  const addUEs = async (uesToAdd: any[]) => {
    const newUEs = await Promise.all(uesToAdd.map(async (ue) => {
      return {
        Name: ue['Code UE'],
        TotalHourVolume_CM: ue['Nb Heures - CM'],
        TotalHourVolume_TD: ue['Nb Heures - TD'],
        TotalHourVolume_TP: ue['Nb Heures - TP'],
        ResponsibleId: ue['ResponsibleId'],
        Color: randomColor(),
        LayerId: layers[currentLayerIndex].Id
      };
    }));
  
    try {
      const responses = await Promise.all(newUEs.map(ue => sendUEToServer(ue)));
      const addedUEs = responses.filter(ue => ue !== null);
      setUes({
        ...ues,
        [layers[currentLayerIndex].Id]: [...ues[layers[currentLayerIndex].Id], ...addedUEs]
      });
    } catch (error) {
      console.error('Failed to add UEs:', error);
    }
  
    setSelectedUEs([]);
    closeModal();
  };
  
  const sendUEToServer = async (newUE: any) => {
    const response = await fetch('http://localhost:3000/api/ues', {
      method: 'POST',
      body: JSON.stringify({ ue: newUE, user: { Id: 1 } }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to add UE:', newUE.Name);
      return null;
    }
  };

  const addSelectedUEs = () => {
    const uesToAdd = selectedUEs.map(ueCode => fileData.find(ue => ue['Code UE'] === ueCode)).filter(ue => ue !== undefined);
    console.log('UES to add:', uesToAdd);
    addUEs(uesToAdd);
  };
  
  const addAllFilteredUEs = () => {
    addUEs(filteredUEs);
  };



  useEffect(() => { //TEMPORARY, when working with issue  #27, change this effect with your seach query. 
    const fetchProfs = async () => {
      console.log("fetching profs")
      console.log("contextId:", contextId);
      if (contextId === -1) return;
      if (contextId != undefined) {
        const profsData = await searchProfs('');
        console.log("Updating profs")
        console.log("profsData:", profsData);
        setProfs(profsData);

      }
      console.log("new profs:", profs)
      return;
    };
    console.log("Updating profs")
    fetchProfs();
    
  }, [contextId]);

  const searchProfs = async (query: string) => {
    const searchQuery = query === '' ? '%25all%25' : query;
    console.log("searching for profs with query:", searchQuery);
    try {
      const response = await fetch(`http://localhost:3000/api/profs/search/${contextId}/${searchQuery}`);
      if (response.ok) {
        const profsData = await response.json();
        return profsData;
      } else {
        console.error("Error searching profs:", response.statusText);
        return [];
      }
    } catch (error) {
      console.error("Error searching profs:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trammeResponse = await fetch(`http://localhost:3000/api/trammes/${trammeId}`);
        if (trammeResponse.ok) {
          const trammeData = await trammeResponse.json();
          const contextId = trammeData.ContextId;
          console.log(trammeData)
          setContextId(contextId);
          setTrammeNameInput(trammeData.Name);
          console.log("contextId:", contextId);

          const layersResponse = await fetch(`http://localhost:3000/api/layers/tramme/${trammeId}`);
          if (layersResponse.ok) {
            const layersData = await layersResponse.json();
            setCouches(layersData);

            const uesResponse = await fetch(`http://localhost:3000/api/ues/tramme/${trammeId}`);
            if (uesResponse.ok) {
              const uesData = await uesResponse.json();
              console.log("uesData:", uesData);
              const uesByLayer = layersData.reduce((acc: { [key: string]: UE[] | number[] }, layer: Layer) => { //Des fois typescript me donne envie de me jetter d'un pont (autocompleté par copilot mdr) 
                acc[layer.Id] = uesData.filter((ue: UE) => ue.LayerId === layer.Id);
                return acc;
              }, {} as { [key: string]: UE[] | number[] });
              setUes(uesByLayer);
            } else {
              console.error("Error fetching UEs:", uesResponse.statusText);
            }
          } else {
            console.error("Error fetching layers:", layersResponse.statusText);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [trammeId, contextId]);

  const addUE = async () => {
    if (ueNameInput === '') return;
    console.log("Adding UE __________________________________________________________")
    console.log("layers:", layers)
    console.log("currentLayerIndex:", currentLayerIndex)
    console.log("layers[currentLayerIndex].Id:", layers[currentLayerIndex].Id)
    console.log("ues:", ues)
    console.log("ues[currentLayerIndex]:", ues[layers[currentLayerIndex].Id])
    console.log("__________________________________________________________")
    if (ues[layers[currentLayerIndex].Id].findIndex(ue => ue.Name === ueNameInput) !== -1) return;
    const newUE = {
      Name: ueNameInput,
      TotalHourVolume_CM: ueCMVolumeInput,
      TotalHourVolume_TD: ueTDVolumeInput,
      TotalHourVolume_TP : ueTPVolumeInput,
      ResponsibleId: ueProfResponsableInput,
      Color: ueColorInput,
      LayerId: layers[currentLayerIndex].Id
    };
    const response = await fetch('http://localhost:3000/api/ues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ue: newUE,  user: { Id: 1 } })
    });
    if (response.ok) {
      const createdUE = await response.json();
      setUes({
        ...ues,
        [layers[currentLayerIndex].Id]: [...ues[layers[currentLayerIndex].Id], createdUE]
      });
    }
  };

  const removeUE = async (index: number) => {
    const ueToRemove = ues[layers[currentLayerIndex].Id][index];
    const response = await fetch(`http://localhost:3000/api/ues/${ueToRemove.Id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      setUes({
        ...ues,
        [layers[currentLayerIndex].Id]: ues[layers[currentLayerIndex].Id].filter((_, i) => i !== index)
      });
    }
  };

  
  const addLayer = async () => {
    if (layerNameInput === '') return
    const response = await fetch('http://localhost:3000/api/layers/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        layer: {
          Name: layerNameInput,
          TrammeId: trammeId,
          Color: layerColorInput || defaultColors[layers.length % defaultColors.length]
        },
        user: { Id: 1 }
      })
    })
    if (response.ok) {
      const newLayer = await response.json()
      setCouches([...layers, newLayer])
      setUes({ ...ues, [newLayer.Id]: [] })
      setLayerNameInput('');
      setLayerColorInput('');
    }
  }

  const removeLayer = async (index: number) => {
    const layerToRemove = layers[index]
    const response = await fetch(`http://localhost:3000/api/layers/${layerToRemove.Id}`, {
      method: 'DELETE'
    })
    if (response.ok) {
      setCouches(layers.filter((_, i) => i !== index))
    }
  }

  const handleNameInputChange = async (newName: string) => {
    const response = await fetch(`http://localhost:3000/api/trammes/${trammeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Name: newName })
    });
    console.log('response:', response);
    if (response.ok) {
      const updatedTramme = await response.json();
      console.log('Tramme name updated:', updatedTramme);
      setTrammeNameInput(updatedTramme.Name);
    } else {
      console.error('Failed to set tramme name');
    }
  };

  useEffect(() => {
    if (setupStage === 4 + layers.length) {
      navigate(`/calendar/${trammeId}`)
    } else

      if (setupStage - 3 < 0) {
        setCurrentLayerIndex(0)
      }
      else if (setupStage >= layers.length + 3) {
        setCurrentLayerIndex(layers.length - 1)
      } else {
        setCurrentLayerIndex(setupStage - 3)
      }
    console.log("_______________")
    console.log("current Layer : ", currentLayerIndex)
    console.log("current setup stage : ", setupStage)
  }, [setupStage, layers])




  const disableNextButton = () => {
    if (setupStage === 2 && layers.length === 0) return true
    return false
  }

  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='font-bold mb-8 text-2xl '>Veuillez définir les données à utiliser dans la tramme</h1>
      <div className='flex items-center justify-around mb-8  '>
        <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${setupStage === 1 ? 'bg-blue-500 text-white' : setupStage > 1 ? 'bg-white border-4 border-blue-400 text-blue-400' : 'bg-gray-500 text-white'}`}>
          1
        </div>
        <h1 className={`font-bold text-2xl ml-2 mr-8 ${setupStage === 1 ? 'text-black' : setupStage > 1 ? 'text-blue-400' : 'text-gray-400'}`}> Nom </h1>
        <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${setupStage === 2 ? 'bg-blue-500 text-white' : setupStage > 2 ? 'bg-white border-4 border-blue-400 text-blue-400' : 'bg-gray-500 text-white'}`}>
          2
        </div>
        <h1 className={`font-bold text-2xl ml-2 mr-8 ${setupStage === 2 ? 'text-black' : setupStage > 2 ? 'text-blue-400' : 'text-gray-400'}`}> layers </h1>
        <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${setupStage >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}`}>
          3
        </div>
        <h1 className={`font-bold text-2xl ml-2 mr-8 ${setupStage >= 3 ? 'text-black' : 'text-gray-400'}`}> UEs </h1>
      </div>
      {setupStage === 1 && <h1 className='font-bold text-xl mb-4'>Saisissez le nom de la tramme</h1>}
      {setupStage === 2 && <h1 className='font-bold text-xl mb-4'>Ajoutez des layers</h1>}
      {setupStage >= 3 && setupStage < 3 + layers.length && <h1 className='text-xl font-semibold mb-4'>Ajouter UE pour : <span className='font-bold'>{layers[currentLayerIndex].Name}</span> </h1>}
      {setupStage >= 3 + layers.length && <h1 className='text-xl font-semibold mb-4'>Tout est pret! </h1>}
      <div className='border-2 rounded-xl  border-black  h-[30rem] overflow-auto px-8 py-4 relative'>

        {
          setupStage === 1 && (
            <div className='flex flex-col items-center justify-between mb-8'>
              <label htmlFor="trammeNameInput" className='text-xl font-semibold'>Nom de la tramme : </label>
              <input
                type="text"
                id="trammeNameInput"
                className='border-b-2 border-black select-none outline-none p-2'
                value={trammeNameInput}
                onChange={(e) => handleNameInputChange(e.target.value)}
              />
            </div>
          )
        }


        {setupStage === 2 &&
          (<>
            <div className='flex items-center justify-between mb-8'>
              <label htmlFor="layerNameInput" className='text-xl font-semibold'>Nom du layer : </label>
              <input
                type="text"
                id="layerNameInput"
                className='border-b-2 border-black select-none outline-none p-2'
                value={layerNameInput}
                onChange={(e) => setLayerNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && layers.length > 0) {
                    setSetupStage(setupStage + 1);
                  } else if (e.key === 'Enter') {
                    addLayer();
                  }
                }}
              />
              <button className='h-8 w-16 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-700 transition-all duration-300 hover:scale-105' onClick={addLayer}>+</button>
            </div>
            {layers.length > 0 ? <div>
              {layers.map((layer, index) => {
                return (
                  <div className='flex items-center justify-between border-2 border-black p-2 mb-2 rounded-xl' key={index} style={{ backgroundColor: layer.Color }}>
                    <p className='ml-4'>{layer.Name}</p>
                    <button className='mr-4' onClick={() => removeLayer(index)}>X</button>
                  </div>
                )
              })}
            </div> : <div className='mt-8 text-gray-500'>
              <h1 className='text-gray-600 font-bold text-xl mb-4'>Aucun layer défini</h1>
              <p>Ajoutez votre premier layer</p><h1 className='my-2'> ou </h1><p className='text-blue-500 underline'>importez des layers d'une autre tramme</p>.
            </div>}
          </>)
        }
        {
          setupStage >= 3 + layers.length && (<div className='flex items-center justify-center h-full w-full'>
            <h1>Clickez sur suivant pour valider et commpleter le setup.</h1>

          </div>)
        }

{setupStage >= 3 && setupStage < 3 + layers.length && (
  <>
    <div className='flex flex-col items-center justify-between mb-8'>
      <div className='flex flex-col items-start justify-between mb-8'>
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
              Rechercher et ajouter des UEs
            </button>
            <button
              className='bg-red-500 text-white p-2 rounded ml-4'
              onClick={resetFileState}
            >
              Changer de fichier
            </button>
          </div>
        )}
        <div className='flex items-center justify-between mb-4'>
          <label htmlFor="ueNameInput" className='text-xl font-semibold'>Nom de l'UE : </label>
          <input
            type="text"
            id="ueNameInput"
            className='border-b-2 border-black select-none outline-none p-2'
            value={ueNameInput}
            onChange={(e) => setUeNameInput(e.target.value)}
          />
          <input
            type="color"
            id="ueColorInput"
            className='border-b-2 border-black select-none outline-none p-2'
            value={ueColorInput}
            onChange={(e) => setUeColorInput(e.target.value)}
          />
        </div>

        <div className='flex items-center justify-between mb-4'>
          <label htmlFor="ueProfResponsableInput" className='text-xl font-semibold'>Prof responsable : </label>
          <select
            id="ueProfResponsableInput"
            className='border-b-2 border-black select-none outline-none p-2'
            value={ueProfResponsableInput}
            onChange={(e) => setUeProfResponsableInput(e.target.value)}
          >
            <option value="">Sélectionnez un prof</option>
            {profs.map((prof, index) => (
              <option key={index} value={prof.Id}>
                {prof.FullName}
              </option>
            ))}
          </select>
        </div>

        <div className='flex items-center justify-between mb-4'>
          <label htmlFor="ueCMVolumeInput" className='text-xl font-semibold'>Volume horaire CM : </label>
          <input
            type="number"
            id="ueCMVolumeInput"
            className='border-b-2 border-black select-none outline-none p-2'
            value={ueCMVolumeInput}
            onChange={(e) => setUeCMVolumeInput(parseInt(e.target.value))}
          />
          <label htmlFor="ueTDVolumeInput" className='text-xl font-semibold'>TD : </label>
          <input
            type="number"
            id="ueTDVolumeInput"
            className='border-b-2 border-black select-none outline-none p-2'
            value={ueTDVolumeInput}
            onChange={(e) => setUeTDVolumeInput(parseInt(e.target.value))}
          />
          <label htmlFor="ueTPVolumeInput" className='text-xl font-semibold'>TP : </label>
          <input
            type="number"
            id="ueTPVolumeInput"
            className='border-b-2 border-black select-none outline-none p-2'
            value={ueTPVolumeInput}
            onChange={(e) => setUeTPVolumeInput(parseInt(e.target.value))}
          />
        </div>
        <button className='h-8 w-16 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-700 transition-all duration-300 hover:scale-105' onClick={addUE}>+</button>
      </div>
    </div>
    {ues[layers[currentLayerIndex].Id] && ues[layers[currentLayerIndex].Id].length > 0 ? (
      <div>
        {ues[layers[currentLayerIndex].Id].map((ue, index) => (
          <div className='flex items-center justify-between border-2 border-black p-2 mb-2 rounded-xl' key={index} style={{ backgroundColor: ue.Color }}>
            <p className='ml-4'>{ue.Name}</p>
            <button className='mr-4' onClick={() => removeUE(index)}>X</button>
          </div>
        ))}
      </div>
    ) : (
      <div className='mt-8 text-gray-500'>
        <h1 className='text-gray-600 font-bold text-xl mb-4'>Aucune UE définie</h1>
        <p>Ajoutez votre première UE</p><h1 className='my-2'> ou </h1><p className='text-blue-500 underline'>importez des UEs d'une autre tramme</p>.
      </div>
    )}
  </>
)}
{isModalOpen && (
  <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center'>
    <div className='bg-white p-4 rounded-lg'>
      <h2 className='text-xl font-bold mb-4'>Rechercher des UEs</h2>
      <input
        type="text"
        placeholder="Rechercher..."
        className='border-b-2 border-black select-none outline-none p-2 mb-4'
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setFilteredUEs(fileData.filter(ue => ue['Code UE'].toLowerCase().includes(e.target.value.toLowerCase())));
        }}
      />
      <div className='max-h-64 overflow-y-auto'>
        {filteredUEs.map((ue, index) => (
          <div key={index} className='flex items-center justify-between mb-2'>
            <input
              type="checkbox"
              checked={selectedUEs.includes(ue['Code UE'])}
              data-index={index}
              onChange={(e) => handleCheckboxChange(e, index)}
            />
            <p>{ue['Code UE']}</p>
          </div>
        ))}
      </div>
      <button
        className='bg-green-500 text-white p-2 rounded mt-4'
        onClick={addSelectedUEs}
      >
        Ajouter sélectionnés
      </button>
      <button
        className='bg-green-500 text-white p-2 rounded mt-4 ml-4'
        onClick={addAllFilteredUEs}
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


      </div>
      <div className='flex items-center justify-between w-80 mt-8'>
        <button className='h-12 w-32 bg-gray-300 text-gray-600 disabled:cursor-not-allowed disabled:text-white disabled:hover:scale-100 disabled:hover:bg-gray-300 font-bold rounded-md hover:bg-gray-500 transition-all duration-300 hover:scale-105' disabled={setupStage === 1} onClick={() => setSetupStage(setupStage - 1)}>
          Precedent
        </button>
        <button className='h-12 w-32 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-700 disabled:text-white disabled:hover:scale-100 disabled:hover:bg-gray-300 disabled:bg-gray-300 transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed' disabled={disableNextButton()} onClick={() => setSetupStage(setupStage + 1)}>
          Suivant
        </button>
      </div>
    </div>
  )
}

export default SetupPage