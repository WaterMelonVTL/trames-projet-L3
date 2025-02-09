import React, { useState, useEffect } from 'react'

interface SetupNameStageProps {
  trammeId: string;
}

const ST_SetupNameStage: React.FC<SetupNameStageProps> = ({ trammeId }) => {
  const [trammeName, setTrammeName] = useState<string>('')

  const updateTrammeName = async (newName: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/trammes/${trammeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Name: newName })
      })
      if (response.ok) {
        const updatedTramme = await response.json()
        setTrammeName(updatedTramme.Name)
      }
    } catch (error) {
      console.error('Error updating tramme name:', error)
    }
  }

  const fetchTrammeName = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/trammes/${trammeId}`)
      if (response.ok) {
        const tramme = await response.json()
        setTrammeName(tramme.Name)
      }
    } catch (error) {
      console.error('Error fetching tramme name:', error)
    }
  }

  useEffect(() => {
    fetchTrammeName()
  }, [])

  return (
    <div className="flex flex-col items-center mb-8">
      <label htmlFor="trammeNameInput" className="text-2xl font-semibold mb-4">
        Nom de la tramme :
      </label>
      <input
        type="text"
        id="trammeNameInput"
        className="w-full max-w-md border-b-2 border-gray-300 focus:border-blue-500 outline-none p-2 text-xl"
        value={trammeName}
        onChange={(e) => updateTrammeName(e.target.value)}
        placeholder="Entrez le nom..."
      />
    </div>
  )
}

export default ST_SetupNameStage
