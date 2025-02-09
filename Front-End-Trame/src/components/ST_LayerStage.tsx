import React, { useState, useEffect } from 'react'
import { Layer } from '../types/types'
import EditLayerModal from './EditLayerModal'

interface LayerStageProps {
  trammeId: string;
  setTotalLayers: React.Dispatch<React.SetStateAction<number>>;
}

const ST_LayerStage: React.FC<LayerStageProps> = ({ trammeId, setTotalLayers }) => {
  const [layerName, setLayerName] = useState<string>('')
  const [layerColor, setLayerColor] = useState<string>('')  
  const [layers, setLayers] = useState<Layer[]>([])

  const [editingLayer, setEditingLayer] = useState<Layer | null>(null)

  useEffect(() => {
    const fetchLayers = async () => {
      const response = await fetch(`http://localhost:3000/api/layers/tramme/${trammeId}`)
      if(response.ok){
        const data = await response.json()
        setLayers(data)
        setTotalLayers(data.length)
      }
    }
    fetchLayers()
  }, [trammeId])

  const addLayer = async () => {
    if (!layerName) return
    const pastelColors = [
      '#FFB3BA', // pastel pink
      '#BAFFC9', // pastel green
      '#BAE1FF', // pastel blue
      '#FFFFBA', // pastel yellow
      '#FFE4B5', // pastel orange
      '#E0BBE4', // pastel purple
      '#957DAD', // pastel lavender
      '#FEC8D8', // light pink
      '#D4F0F0', // light cyan
      '#FFDFD3'  // pastel peach
    ];
    const randomColor = pastelColors[Math.floor(Math.random() * pastelColors.length)];
    
    const response = await fetch('http://localhost:3000/api/layers/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
      layer: {
        Name: layerName,
        TrammeId: trammeId,
        Color: layerColor || randomColor
      },
      user: { Id: 1 }
      })
    })
    if (response.ok) {
      const newLayer = await response.json()
      setLayers([...layers, newLayer])
      setLayerName('')
      setLayerColor('')
      setTotalLayers(layers.length + 1)
    }
  }

  const removeLayer = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const layerToRemove = layers[index]
    const response = await fetch(`http://localhost:3000/api/layers/${layerToRemove.Id}`, {
      method: 'DELETE'
    })
    if (response.ok) {
      setLayers(layers.filter((_, i) => i !== index))
      setTotalLayers(layers.length  - 1)
    }
  }

  const openEditModal = (layer: Layer) => {
    setEditingLayer(layer)
  }

  const handleUpdateLayer = (updatedLayer: Layer) => {
    console.log(updatedLayer)
    const newLayers = layers.map(l => l.Id === updatedLayer.Id ? updatedLayer : l)
    console.log(newLayers)
    setLayers(newLayers)
    setEditingLayer(null)
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <label htmlFor="layerNameInput" className="text-xl font-semibold">
          Nom du layer :
        </label>
        <input
          type="text"
          id="layerNameInput"
          className="w-60 border-b-2 border-gray-300 focus:border-blue-500 outline-none p-2"
          value={layerName}
          onChange={(e) => setLayerName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addLayer() }}
          placeholder="Ex. L1..."
        />
        <button
          onClick={addLayer}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          +
        </button>
      </div>
      {layers.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {layers.map((layer, index) => (
            <div 
              key={index} 
              className="p-4 rounded shadow-lg flex items-center hover:scale-105 hover:shadow-2xl cursor-pointer" 
              style={{ backgroundColor: layer.Color }}
              onClick={() => openEditModal(layer)}
            >
              <p className="text-lg font-medium">{layer.Name}</p>
              <button 
                onClick={(e) => removeLayer(index, e)} 
                className="ml-auto p-2 text-gray-600 hover:text-red-600 transition-colors duration-200 rounded-full hover:bg-red-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500">Aucun layer défini. Ajoutez votre premier layer.</div>
      )}

      {editingLayer && (
        <EditLayerModal 
          layer={editingLayer}
          onClose={() => setEditingLayer(null)}
          onUpdate={handleUpdateLayer}
        />
      )}
    </div>
  )
}

export default ST_LayerStage
