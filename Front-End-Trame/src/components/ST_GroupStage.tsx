import React, { useState, useEffect } from 'react'
import { api } from '../public/api/api.js'

interface GroupStageProps {
  trammeId: string;
  index: number;
}

const ST_GroupStage: React.FC<GroupStageProps> = ({ trammeId, index }) => {
  const [groupName, setGroupName] = useState<string>('')
  const [layers, setLayers] = useState<any[]>([])
  const [currentLayerName, setCurrentLayerName] = useState<string>('')
  const [currentLayerId, setCurrentLayerId] = useState<string>('')

  // New state to hold UEs of the current layer
  const [ueList, setUeList] = useState<any[]>([])

  useEffect(() => {
    const fetchLayers = async () => {
      try {
        const data = await api.get(`/layers/tramme/${trammeId}?withGroups=true`)
        console.log(data)
        setLayers(data)
        setCurrentLayerId(data[0].Id)
        setCurrentLayerName(data[0].Name)
      } catch (error) {
        console.error('Error fetching layers:', error)
      }
    }
    fetchLayers()
  }, [trammeId])

  useEffect(() => {
    if (!currentLayerId) return
    const fetchUes = async () => {
      try {
        const data = await api.get(`/ues/layer/${currentLayerId}`)
        setUeList(data)
      } catch (error) {
        console.error('Failed to fetch UEs for layer:', currentLayerId)
      }
    }
    fetchUes()
  }, [currentLayerId])

  useEffect(() => {
    if (!layers[index]) return
    setCurrentLayerId(layers[index].Id)
    setCurrentLayerName(layers[index].Name)
  }, [index, layers])

  const addGroup = async () => {
    if (!groupName) return
    // Optimistically update UI
    setLayers(prevLayers => prevLayers.map(layer => {
      if(layer.Id === currentLayerId){
        return { ...layer, Groups: [...(layer.Groups || []), { Name: groupName }] }
      }
      return layer
    }))
    
    try {
      const newGroup = await api.post('/groups/', {
        group: {
          Name: groupName,
          LayerId: currentLayerId
        }
      })
      
      setLayers(prevLayers => prevLayers.map(layer => {
        if(layer.Id === currentLayerId){
          const updatedGroups = (layer.Groups || []).filter(g => g.Name !== groupName)
          return { ...layer, Groups: [...updatedGroups, newGroup] }
        }
        return layer
      }))
    } catch (error) {
      console.error('Error adding group:', error)
    }
    
    setGroupName('')
  }

  const removeGroup = async (groupIndex: number) => {
    const currentLayer = layers.find(layer => layer.Id === currentLayerId)
    if (!currentLayer || !currentLayer.Groups) return
    const groupToRemove = currentLayer.Groups[groupIndex]
    
    try {
      await api.delete(`/groups/${groupToRemove.Id}`)
      setLayers(prevLayers => prevLayers.map(layer => {
        if(layer.Id === currentLayerId){
          return { ...layer, Groups: layer.Groups.filter((_: any, i: number) => i !== groupIndex) }
        }
        return layer
      }))
    } catch (error) {
      console.error('Error removing group:', error)
    }
  }

  // Get groups from the current layer
  const currentLayerGroups = layers.find(layer => layer.Id === currentLayerId)?.Groups || []

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">
        Ajouter Groupes pour : <span className="font-bold">{currentLayerName}</span>
      </h1>
      <div className="flex items-center justify-between mb-6">
        <label htmlFor="groupNameInput" className="text-xl font-semibold">Nom du groupe :</label>
        <input
          type="text"
          id="groupNameInput"
          className="w-60 border-b-2 border-gray-300 focus:border-blue-500 outline-none p-2"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addGroup()}
          placeholder="Nom du groupe..."
        />
        <button onClick={addGroup} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
          +
        </button>
      </div>
      {currentLayerGroups.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {currentLayerGroups.map((group: any, i: number) => (
            <div key={i} 
            style={{ backgroundColor: layers[index].Color }}
            className="p-4 rounded  shadow-lg flex items-center hover:scale-105 hover:shadow-2xl cursor-pointer">
              <p className="text-lg">{group.Name}</p>
              <button onClick={() => removeGroup(i)} className="ml-auto p-2 text-gray-600 hover:text-red-600 transition-colors duration-200 rounded-full hover:bg-red-100">
                X
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500">Aucun groupe défini. Ajoutez votre premier groupe.</div>
      )}
      {/* Optionally, show UEs for current layer */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold">UEs du layer</h2>
        {ueList.length > 0 ? (
          <ul className="list-disc ml-4">
            {ueList.map((ue: any, i: number) => (
              <li key={i}>{ue.Name}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Aucune UE définie pour ce layer</p>
        )}
      </div>
    </div>
  )
}

export default ST_GroupStage
