import React from 'react'
import { Layer } from '../types/types'
import EditLayerModal from './EditLayerModal.js'
interface CalendarLayerSelectionProps {
  layers: Layer[];
  updateLayer: (layer: Layer) => void;  // Changed from setLayers to updateLayer
  onClick: (id: number) => void;
  currentLayerId: number;
}

function CalendarLayerSelection({ layers, updateLayer, onClick, currentLayerId }: CalendarLayerSelectionProps) {
    const [editingLayer, setEditingLayer] = React.useState(null as Layer | null)

    const handleUpdateLayer = (updatedLayer: Layer) => {
        console.log(updatedLayer)
        updateLayer(updatedLayer)
        setEditingLayer(null)
    }

    return (
        <div className='flex flex-row flex-wrap justify-start items-center w-[80vw] '>
            {layers.map((layer: Layer) => (
                <div
                    key={layer.Id}
                    onClick={() => onClick(layer.Id)}
                    onContextMenu={(e) => {
                        e.preventDefault()
                        setEditingLayer(layer)
                    }}
                    className="flex max-w-[20rem] rounded-t-lg flex-row items-center justify-center w-40 h-10 border-2 border-black border-b-0 hover:cursor-pointer transition-all duration-300"
                    style={{
                        backgroundColor: currentLayerId === layer.Id ? layer.Color : 'white'
                    }}
                >
                    {layer.Name}
                </div>
            ))}
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

export default CalendarLayerSelection