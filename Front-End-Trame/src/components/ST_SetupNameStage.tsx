import React, { useState, useEffect } from 'react'

interface SetupNameStageProps {
  trameId: string;
}

const ST_SetupNameStage: React.FC<SetupNameStageProps> = ({ trameId }) => {
  const [trameName, setTrameName] = useState<string>('')

  const updateTrameName = async (newName: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/trames/${trameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Name: newName })
      })
      if (response.ok) {
        const updatedTrame = await response.json()
        setTrameName(updatedTrame.Name)
      }
    } catch (error) {
      console.error('Error updating trame name:', error)
    }
  }

  const fetchTrameName = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/trames/${trameId}`)
      if (response.ok) {
        const trame = await response.json()
        setTrameName(trame.Name)
      }
    } catch (error) {
      console.error('Error fetching trame name:', error)
    }
  }

  useEffect(() => {
    fetchTrameName()
  }, [])

  return (
    <div className="flex flex-col items-center mb-8">
      <label htmlFor="trameNameInput" className="text-2xl font-semibold mb-4">
        Nom de la trame :
      </label>
      <input
        type="text"
        id="trameNameInput"
        className="w-full max-w-md border-b-2 border-gray-300 focus:border-blue-500 outline-none p-2 text-xl"
        value={trameName}
        onChange={(e) => updateTrameName(e.target.value)}
        placeholder="Entrez le nom..."
      />
    </div>
  )
}

export default ST_SetupNameStage
