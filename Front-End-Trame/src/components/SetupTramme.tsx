import React, { useEffect } from 'react'
import { UE, Layer, Prof, Room } from "../types/types";
import { useNavigate } from 'react-router-dom';
function SetupPage() {
  const navigate = useNavigate();
  const trammeId = location.pathname.split('/').pop();

  const [contextId, setContextId] = React.useState<number>(-1)
  const [setupStage, setSetupStage] = React.useState<number>(1)

  const [layers, setCouches] = React.useState<Layer[]>([])
  const [ues, setUes] = React.useState<{ [key: number]: UE[] }>({})

  
  const [profs, setProfs] = React.useState<Prof[]>([])
  const [rooms, setRooms] = React.useState<Room[]>([])


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

  const [ueCMVolumeHebdoInput, setUeCMVolumeHebdoInput] = React.useState<number>(0)
  const [ueTDVolumeHebdoInput, setUeTDVolumeHebdoInput] = React.useState<number>(0)
  const [ueTPVolumeHebdoInput, setUeTPVolumeHebdoInput] = React.useState<number>(0)


  const [ueCMProfInput, setUeCMProfInput] = React.useState<number>(0)
  const [ueTDProfInput, setUeTDProfInput] = React.useState<number>(0)
  const [ueTPProfInput, setUeTPProfInput] = React.useState<number>(0)

 
  const [amphiParDefautInput, setAmphiParDefautInput] = React.useState<string>('')
  //_____________________________________________________________________________________________________________

  const defaultColors = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF']

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

  useEffect(() => { //TEMPORARY, when working with issue  #27, change this effect with your seach query. 
    const fetchRooms = async () => {
      if (contextId === -1) return;
      if (contextId != undefined) {
        const roomsData = await searchRooms('');
        setRooms(roomsData);
      }
    };
    console.log("Updating rooms")
    fetchRooms();
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

  const searchRooms = async (query: string) => {
    const searchQuery = query === '' ? '%25all%25' : query;
    console.log("searching for rooms with query:", searchQuery);

    try {
      const response = await fetch(`http://localhost:3000/api/rooms/search/${contextId}/${searchQuery}`);
      if (response.ok) {
        const roomsData = await response.json();
        return roomsData;
      } else {
        console.error("Error searching rooms:", response.statusText);
        return [];
      }
    } catch (error) {
      console.error("Error searching rooms:", error);
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
              const uesByLayer = layersData.reduce((acc, layer) => {
                acc[layer.Id] = uesData.filter(ue => ue.LayerId === layer.Id);
                return acc;
              }, {});
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
      DefaultHourVolumeHebdo_CM: ueCMVolumeHebdoInput,
      DefaultHourVolumeHebdo_TD: ueTDVolumeHebdoInput,
      DefaultHourVolumeHebdo_TP: ueTPVolumeHebdoInput,
      ResponsibleId: ueProfResponsableInput,
      Color: ueColorInput,
      AmphiByDefaultId: amphiParDefautInput,
      TDParDefaut: tdParDefautInput,
      LayerId: layers[currentLayerIndex].Id,
    };
    const response = await fetch('http://localhost:3000/api/ues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ue: newUE,  user: { Id: 1 },profs_CM:[], profs_TD:[], profs_TP:[] })
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
      setUes({ ...ues, [newLayer]: [] })
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

        {setupStage >= 3 && setupStage < 3 + layers.length &&
          (<>
            <div className='flex flex-col items-center justify-between mb-8'>



              <div className='flex flex-col items-start justify-between mb-8'>
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
                        {prof.FirstName} {prof.LastName}
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

                <div className='flex items-center justify-between mb-4'>

                </div>

                <div className='flex items-center justify-between mb-4'>
                  <label htmlFor="ueCMProfInput" className='text-xl font-semibold'>Prof CM : </label>
                  <select
                    id="ueCMProfInput"
                    className='border-b-2 border-black select-none outline-none p-2'
                    value={ueCMProfInput}
                    onChange={(e) => setUeCMProfInput(parseInt(e.target.value))}
                  >
                    <option value="">Sélectionnez un prof</option>
                    {profs.map((prof, index) => (
                      <option key={index} value={prof.Id}>
                        {prof.FirstName} {prof.LastName}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="ueTDProfInput" className='text-xl font-semibold'>Prof TD : </label>
                  <select
                    id="ueTDProfInput"
                    className='border-b-2 border-black select-none outline-none p-2'
                    value={ueTDProfInput}
                    onChange={(e) => setUeTDProfInput(parseInt(e.target.value))}
                  >
                    <option value="">Sélectionnez un prof</option>
                    {profs.map((prof, index) => (
                      <option key={index} value={prof.Id}>
                        {prof.FirstName} {prof.LastName}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="ueTPProfInput" className='text-xl font-semibold'>Prof TP : </label>
                  <select
                    id="ueTPProfInput"
                    className='border-b-2 border-black select-none outline-none p-2'
                    value={ueTPProfInput}
                    onChange={(e) => setUeTPProfInput(parseInt(e.target.value))}
                  >
                    <option value="">Sélectionnez un prof</option>
                    {profs.map((prof, index) => (
                      <option key={index} value={prof.Id}>
                        {prof.FirstName} {prof.LastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='flex items-center justify-between mb-4'>

                </div>

                <div className='flex items-center justify-between mb-4'>
                  <label htmlFor="ueCMVolumeHebdoInput" className='text-xl font-semibold'>Volume horaire hebdo CM : </label>
                  <input
                    type="number"
                    id="ueCMVolumeHebdoInput"
                    className='border-b-2 border-black select-none outline-none p-2'
                    value={ueCMVolumeHebdoInput}
                    onChange={(e) => setUeCMVolumeHebdoInput(parseInt(e.target.value))}
                  />
                  <label htmlFor="ueTDVolumeHebdoInput" className='text-xl font-semibold'> TD : </label>
                  <input
                    type="number"
                    id="ueTDVolumeHebdoInput"
                    className='border-b-2 border-black select-none outline-none p-2'
                    value={ueTDVolumeHebdoInput}
                    onChange={(e) => setUeTDVolumeHebdoInput(parseInt(e.target.value))}
                  />
                  <label htmlFor="ueTPVolumeHebdoInput" className='text-xl font-semibold'> TP : </label>
                  <input
                    type="number"
                    id="ueTPVolumeHebdoInput"
                    className='border-b-2 border-black select-none outline-none p-2'
                    value={ueTPVolumeHebdoInput}
                    onChange={(e) => setUeTPVolumeHebdoInput(parseInt(e.target.value))}
                  />
                </div>

                <div className='flex items-center justify-between mb-4'>
                  <label htmlFor="amphiParDefautInput" className='text-xl font-semibold'>Amphi par défaut : </label>
                  <select
                  id="amphiParDefautInput"
                  className='border-b-2 border-black select-none outline-none p-2'
                  value={amphiParDefautInput}
                  onChange={(e) => setAmphiParDefautInput(e.target.value)}
                  >
                  <option value="">Sélectionnez une salle</option>
                  {rooms.map((room, index) => (
                    <option key={index} value={room.Id}>
                    {room.Name}
                    </option>
                  ))}
                  </select>
                  
                </div>


                <div className='flex items-center justify-between mb-4'>

                </div>

                <button className=' w-24 self-center bg-blue-500 text-white font-bold rounded-md hover:bg-blue-700 transition-all duration-300 hover:scale-105 p-2' onClick={addUE}>Ajouter</button>
              </div>

            </div>
            {ues[layers[currentLayerIndex].Id] && ues[layers[currentLayerIndex].Id].length > 0 ? <div>
              {ues[layers[currentLayerIndex].Id].map((ue, index) => {
                return (
                  <div className='flex items-center justify-between border-2 border-black p-2 mb-2 rounded-xl' key={index} style={{ backgroundColor: ue.Color }}>
                    <p className='ml-4'>{ue.Name}</p>
                    <button className='mr-4' onClick={() => removeUE(index)}>X</button>
                  </div>
                )
              })}
            </div> : <div className='mt-8 text-gray-500'>
              <h1 className='text-gray-600 font-bold text-xl mb-4'>Aucune UE définie</h1>
              <p>Ajoutez votre premiere UE</p><h1 className='my-2'> ou </h1><p className='text-blue-500 underline'>importez des Ues d'une autre tramme</p>.
            </div>}
          </>)
        }


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