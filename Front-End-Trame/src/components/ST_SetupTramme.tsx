import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ST_SetupHeader from './ST_SetupHeader'
import ST_SetupNameStage from './ST_SetupNameStage'
import ST_LayerStage from './ST_LayerStage'
import ST_GroupStage from './ST_GroupStage'
import ST_UeStage from './ST_UeStage'
import ST_DateStage from './ST_DateStage'

function SetupPage() {
  const navigate = useNavigate()
  const [setupStage, setSetupStage] = useState<number>(1)
  const trameId = location.pathname.split('/').pop() || ''

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <ST_SetupHeader setupStage={setupStage} totalLayers={0} />
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 w-full max-w-4xl h-[30rem] overflow-auto p-8 relative">
        {setupStage === 1 && <ST_SetupNameStage trameId={trameId} />}
        {setupStage === 2 && <ST_DateStage trameId={trameId} />}
        {setupStage === 3 && <ST_LayerStage trameId={trameId} />}
        {setupStage === 4 && <ST_GroupStage trameId={trameId} />}
        {setupStage === 5 && <ST_UeStage trameId={trameId} />}
      </div>
      <div className="flex items-center justify-between w-80 mt-8">
        <button
          disabled={setupStage === 1}
          onClick={() => setSetupStage(setupStage - 1)}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50"
        >
          Précédent
        </button>
        <button
          onClick={() => setSetupStage(setupStage + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}

export default SetupPage
