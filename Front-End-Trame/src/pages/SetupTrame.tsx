import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ST_SetupHeader from '../components/ST_SetupHeader'
import ST_SetupNameStage from '../components/ST_SetupNameStage'
import ST_LayerStage from '../components/ST_LayerStage'
import ST_GroupStage from '../components/ST_GroupStage'
import ST_UeStage from '../components/ST_UeStage'
import ST_DateStage from '../components/ST_DateStage'
import ST_EventStage from '../components/ST_EventStage'

function SetupPage() {
  const navigate = useNavigate()
  const [setupStage, setSetupStage] = useState<number>(1)
  const trameId = location.pathname.split('/').pop() || ''
  const [totalLayers, setTotalLayers] = useState<number>(0)

  // Steps:
  // Stage 1: Name stage
  // Stage 2: Date stage
  // Stage 3: Events stage
  // Stage 4: Layers stage
  // Stages 5 to (4+totalLayers): Group stages (one per layer)
  // Stages (5+totalLayers) to (4+2*totalLayers): Ue stages (one per layer)
  // Final stage: (5+2*totalLayers)

  const finalStage = 5 + 2 * totalLayers

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <ST_SetupHeader setupStage={setupStage} totalLayers={totalLayers} />
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 w-full max-w-4xl h-[30rem] overflow-auto p-8 relative">
        {setupStage === 1 && <ST_SetupNameStage trameId={trameId} />}
        {setupStage === 2 && <ST_DateStage trameId={trameId} />}
        {setupStage === 3 && <ST_EventStage trameId={trameId} />}
        {setupStage === 4 && <ST_LayerStage trameId={trameId} setTotalLayers={setTotalLayers} />}
        {setupStage > 4 && setupStage < (5 + totalLayers) && (
          // Group stage for layer index = setupStage - 3
          <ST_GroupStage trameId={trameId} index={setupStage - 5} />
        )}
        {setupStage >= (5 + totalLayers) && setupStage < finalStage && (
          // UE stage for layer index = setupStage - (3 + totalLayers)
          <ST_UeStage trameId={trameId} index={setupStage - (5 + totalLayers)} />
        )}
        {setupStage === finalStage && (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-3xl font-bold mb-4">Tout est prêt</h1>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between w-80 mt-8">
        <button
          disabled={setupStage === 1}
          onClick={() => setSetupStage(setupStage - 1)}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50"
        >
          Précédent
        </button>
        {setupStage === finalStage ? (
          <button
            onClick={() => navigate(`/calendar/${trameId}`)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Terminer
          </button>
        ) : (
          <button
            onClick={() => setSetupStage(setupStage + 1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Suivant
          </button>
        )}
      </div>
    </div>
  )
}

export default SetupPage
