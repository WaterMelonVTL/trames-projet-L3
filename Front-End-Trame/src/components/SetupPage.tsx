import React, { useEffect } from 'react'
import { ECU } from "../types/types";
function SetupPage() {
  const [setupStage, setSetupStage] = React.useState<number>(1)
  const [couches, setCouches] = React.useState<string[]>([])
  const [profs, setProfs] = React.useState<string[]>([])
  const [ues, setUes] = React.useState<{ [key: string]: ECU[] }>({})
  const [currentLayerIndex, setCurrentLayerIndex] = React.useState<number>(0)
  const [coucheInput, setCoucheInput] = React.useState<string>('')
  const [profInput, setProfInput] = React.useState<string>('')

  const [ueProfResponsableInput, setUeProfResponsableInput] = React.useState<string>('')
  const [ueNameInput, setUeNameInput] = React.useState<string>('')
  const [ueColorInput, setUeColorInput] = React.useState<string>('')
  const [ueCMVolumeInput, setUeCMVolumeInput] = React.useState<number>(0)
  const [ueTDVolumeInput, setUeTDVolumeInput] = React.useState<number>(0)
  const [ueCMProfInput, setUeCMProfInput] = React.useState<string>('')
  const [ueTDProfInput, setUeTDProfInput] = React.useState<string>('')
  const [ueCMVolumeHebdoInput, setUeCMVolumeHebdoInput] = React.useState<number>(0)
  const [ueTDVolumeHebdoInput, setUeTDVolumeHebdoInput] = React.useState<number>(0)

  const defaultColors = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF']

  const addCouche = () => {
    if (coucheInput === '') return
    if (couches.includes(coucheInput)) return
    setCouches([...couches, coucheInput])
    setUes({ ...ues, [coucheInput]: [] })
    setCoucheInput('')
  }

  const removeCouche = (index: number) => {
    setCouches(couches.filter((_, i) => i !== index))
  }

  const addProf = () => {
    if (profInput === '') return
    if (profs.includes(profInput)) return
    setProfs([...profs, profInput])
    setProfInput('')
  }

  const removeProf = (index: number) => {
    setProfs(profs.filter((_, i) => i !== index))
  }

  const addUE = () => {
    if (ueNameInput === '') return
    if (ues[couches[currentLayerIndex]].findIndex(ue => ue.name === ueNameInput) !== -1) return
    setUes({
      ...ues, [couches[currentLayerIndex]]: [...ues[couches[currentLayerIndex]], {
        name: ueNameInput,
        numberOfCM: ueCMVolumeInput,
        numberOfTD: ueTDVolumeInput,
        enseignantCM: ueCMProfInput,
        enseignantTD: [ueTDProfInput],
        color: ueColorInput,
        AmphiParDefaut: "",
        TDParDefaut: ""
      }]
    })
    setUeNameInput('')
    setUeCMVolumeInput(0)
    setUeTDVolumeInput(0)
    setUeCMProfInput('')
    setUeTDProfInput('')
    setUeColorInput('')
  }

  useEffect(() => {
    
    if (setupStage - 3 < 0){
      setCurrentLayerIndex(0)
    }
    else if (setupStage >= couches.length + 3){
      setCurrentLayerIndex(couches.length-1)
    } else {
      setCurrentLayerIndex(setupStage - 3)
    }
    console.log("_______________")
    console.log("current Layer : ", currentLayerIndex)
    console.log("current setup stage : ", setupStage)
  }, [setupStage, couches])


  const disableNextButton = () => {
    if (setupStage === 1 && couches.length === 0) return true
    if (setupStage === 2 && profs.length === 0) return true
    return false
  }

  return (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='font-bold mb-8 text-2xl '>Veuillez définir les données à utiliser dans la tramme</h1>
      <div className='flex items-center justify-around mb-8  '>
        <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${setupStage === 1 ? 'bg-blue-500 text-white' : setupStage > 1 ? 'bg-white border-4 border-blue-400 text-blue-400' : 'bg-gray-500 text-white'}`}>
          1
        </div>
        <h1 className={`font-bold text-2xl ml-2 mr-8 ${setupStage === 1 ? 'text-black' : setupStage > 1 ? 'text-blue-400' : 'text-gray-400'}`}> Couches </h1>
        <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${setupStage === 2 ? 'bg-blue-500 text-white' : setupStage > 2 ? 'bg-white border-4 border-blue-400 text-blue-400' : 'bg-gray-500 text-white'}`}>
          2
        </div>
        <h1 className={`font-bold text-2xl ml-2 mr-8 ${setupStage === 2 ? 'text-black' : setupStage > 2 ? 'text-blue-400' : 'text-gray-400'}`}> Profs </h1>
        <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${setupStage >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}`}>
          3
        </div>
        <h1 className={`font-bold text-2xl ml-2 mr-8 ${setupStage >= 3 ? 'text-black' : 'text-gray-400'}`}> UEs </h1>
      </div>
      {setupStage === 1 && <h1 className='font-bold text-xl mb-4'>Ajoutez de nouvelles couches</h1>}
      {setupStage === 2 && <h1 className='font-bold text-xl mb-4'>Ajoutez de nouveaux profs</h1>}
      {setupStage >= 3 && setupStage<3+couches.length && <h1 className='text-xl font-semibold mb-4'>Ajouter UE pour : <span className='font-bold'>{couches[currentLayerIndex]}</span> </h1>}
      {setupStage >= 3+couches.length && <h1 className='text-xl font-semibold mb-4'>Tout est pret! </h1>}
      <div className='border-2 rounded-xl  border-black  h-[30rem] overflow-auto px-8 py-4 relative'>

        {setupStage === 1 &&
          (<>
            <div className='flex items-center justify-between mb-8'>
                <label htmlFor="coucheInput" className='text-xl font-semibold'>Nom de la couche : </label>
                <input
                type="text"
                id="coucheInput"
                className='border-b-2 border-black select-none outline-none p-2'
                value={coucheInput}
                onChange={(e) => setCoucheInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && couches.length > 0) {
                    setSetupStage(setupStage + 1);
                  } else if (e.key === 'Enter') {
                    addCouche();
                  }
                }}
                />
              <button className='h-8 w-16 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-700 transition-all duration-300 hover:scale-105' onClick={addCouche}>+</button>

            </div>
            {couches.length > 0 ? <div>
              {couches.map((couche, index) => {
                return (
                  <div className='flex items-center justify-between border-2 border-black p-2 mb-2 rounded-xl' key={index} style={{ backgroundColor: defaultColors[index % defaultColors.length] }}>
                    <p className='ml-4'>{couche}</p>
                    <button className='mr-4' onClick={() => removeCouche(index)}>X</button>
                  </div>
                )
              })}
            </div> : <div className='mt-8 text-gray-500'>
              <h1 className='text-gray-600 font-bold text-xl mb-4'>Aucune couche définie</h1>
              <p>Ajoutez votre premiere couche</p><h1 className='my-2'> ou </h1><p className='text-blue-500 underline'>importez des couches d'une autre tramme</p>.
            </div>}
          </>)
        }

        {setupStage === 2 &&
          (<>
            <div className='flex items-center justify-between mb-8'>
              <label htmlFor="profInput" className='text-xl font-semibold'>Nom du prof : </label>
              <input
                type="text"
                id="profInput"
                className='border-b-2 border-black select-none outline-none p-2'
                value={profInput}
                onChange={(e) => setProfInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && profs.length > 0) {
                    setSetupStage(setupStage + 1);
                  } else if (e.key === 'Enter') {
                    addProf();
                  }
                }}
              />
              <button className='h-8 w-16 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-700 transition-all duration-300 hover:scale-105' onClick={addCouche}>+</button>

            </div>
            {profs.length > 0 ? <div>
              {profs.map((prof, index) => {
                return (
                  <div className='flex items-center justify-between border-2 border-black p-2 mb-2 rounded-xl' key={index} style={{ backgroundColor: defaultColors[index % defaultColors.length] }}>
                    <p className='ml-4'>{prof}</p>
                    <button className='mr-4' onClick={() => removeProf(index)}>X</button>
                  </div>
                )
              })}
            </div> : <div className='mt-8 text-gray-500'>
              <h1 className='text-gray-600 font-bold text-xl mb-4'>Aucun prof défini</h1>
              <p>Ajoutez votre premier prof</p><h1 className='my-2'> ou </h1><p className='text-blue-500 underline'>importez des profs d'une autre tramme</p>.
            </div>}
          </>)
        }
        {
          setupStage >= 3+couches.length &&           (<div className='flex items-center justify-center h-full w-full'>
            <h1>Clickez sur suivant pour valider et commpleter le setup.</h1>

          </div>)
        }

        {setupStage >= 3 && setupStage<3+couches.length &&
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
                      <option key={index} value={prof}>
                        {prof}
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
                </div>

                <div className='flex items-center justify-between mb-4'>

                </div>

                <div className='flex items-center justify-between mb-4'>
                  <label htmlFor="ueCMProfInput" className='text-xl font-semibold'>Prof CM : </label>
                  <select
                    id="ueCMProfInput"
                    className='border-b-2 border-black select-none outline-none p-2'
                    value={ueCMProfInput}
                    onChange={(e) => setUeCMProfInput(e.target.value)}
                  >
                    <option value="">Sélectionnez un prof</option>
                    {profs.map((prof, index) => (
                      <option key={index} value={prof}>
                        {prof}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="ueTDProfInput" className='text-xl font-semibold'>Prof TD : </label>
                  <select
                    id="ueTDProfInput"
                    className='border-b-2 border-black select-none outline-none p-2'
                    value={ueTDProfInput}
                    onChange={(e) => setUeTDProfInput(e.target.value)}
                  >
                    <option value="">Sélectionnez un prof</option>
                    {profs.map((prof, index) => (
                      <option key={index} value={prof}>
                        {prof}
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
                </div>

                <div className='flex items-center justify-between mb-4'>

                </div>

                <button className=' w-24 self-center bg-blue-500 text-white font-bold rounded-md hover:bg-blue-700 transition-all duration-300 hover:scale-105 p-2' onClick={addUE}>Ajouter</button>
              </div>

            </div>
            {ues[couches[currentLayerIndex]].length > 0 ? <div>
              {ues[couches[currentLayerIndex]].map((ue, index) => {
                return (
                  <div className='flex items-center justify-between border-2 border-black p-2 mb-2 rounded-xl' key={index} style={{ backgroundColor: ue.color }}>
                    <p className='ml-4'>{ue.name}</p>
                    <button className='mr-4' onClick={() => removeProf(index)}>X</button>
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