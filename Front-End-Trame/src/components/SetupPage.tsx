import React from 'react'

function SetupPage() {
  const [setupStage, setSetupStage] = React.useState<number>(1)
  const [couches, setCouches] = React.useState<string[]>([])
  const [profs, setProfs] = React.useState<string[]>([])
  const [ues, setUes] = React.useState<{ [key: string]: string[] }>({})
  const [coucheInput, setCoucheInput] = React.useState<string>('')
  const [profInput, setProfInput] = React.useState<string>('')

  const defaultColors = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF']

  const addCouche = () => {
    if (coucheInput === '') return
    if (couches.includes(coucheInput)) return
    setCouches([...couches, coucheInput])
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
        <div className={`rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold ${setupStage === 3 ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}`}>
          3
        </div>
        <h1 className={`font-bold text-2xl ml-2 mr-8 ${setupStage === 3 ? 'text-black' : 'text-gray-400'}`}> UEs </h1>
      </div>
      <h1 className='font-bold text-xl mb-4'>Ajoutez de nouvelles couches</h1>
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
                  if (e.key === 'Enter') {
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
                  if (e.key === 'Enter') {
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

        {setupStage === 3 &&
          (<>
            <div className='flex flex-col items-center justify-between mb-8'>
              <label htmlFor="coucheInput" className='text-xl font-semibold'>To do, afficher nom UE avec bouton suivant et precedent </label>
              <h1>To do : use a state to iterate throught the UE array and add UEs to the right couche.</h1>
              <h1>To do : UE creation is a bit more complex than profs and couches since it needs: </h1>
              <h1>To do : -Volume horraire CM</h1>
              <h1>To do : -Volume horraire TD</h1>
              <h1>To do : -Nom du(es) prof CM</h1>
              <h1>To do : -Nom du(es) prof TD</h1>
              <h1>To do : -Couleur</h1>
              <h1>To do : -Volume horraire hebdo CM</h1>
              <h1>To do : -Volume horraire hebdo TD</h1>




             

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
              <h1 className='text-gray-600 font-bold text-xl mb-4'>Aucune UE définie</h1>
              <p>Ajoutez votre premiere UE</p><h1 className='my-2'> ou </h1><p className='text-blue-500 underline'>importez des Ues d'une autre tramme</p>.
            </div>}
          </>)
        }


      </div>
      <div className='flex items-center justify-between w-80 mt-8'>
        <button className='h-12 w-32 bg-gray-300 text-gray-600 disabled:text-white disabled:hover:scale-100 disabled:hover:bg-gray-300 font-bold rounded-md hover:bg-gray-500 transition-all duration-300 hover:scale-105' disabled={setupStage === 1} onClick={() => setSetupStage(2)}>
          Precedent
        </button>
        <button className='h-12 w-32 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-700 transition-all duration-300 hover:scale-105' onClick={() => setSetupStage(setupStage + 1)}>
          Suivant
        </button>
      </div>
    </div>
  )
}

export default SetupPage