import React from 'react'
import { Layer } from '../types/types'
import EditLayerModal from './EditLayerModal'
function CalendarLayerSelection(props: { layers: Layer[], onClick: (id: number) => void, currentLayerId: number , setLayers: React.Dispatch<React.SetStateAction<Layer[]>>}) {
    const [editingLayer, setEditingLayer] = React.useState(null as Layer | null)

    const handleUpdateLayer = (updatedLayer: Layer) => {
        console.log(updatedLayer)
        const newLayers = props.layers.map(l => l.Id === updatedLayer.Id ? updatedLayer : l)
        props.setLayers(newLayers)
        setEditingLayer(null)
    }
    return (
        <div className='flex flex-row flex-wrap justify-start items-center w-[80vw] '>
            {props.layers.map((layer: Layer) => (
                <div
                    key={layer.Id}
                    onClick={() => props.onClick(layer.Id)}
                    onContextMenu={(e) => {
                        e.preventDefault()
                        setEditingLayer(layer)
                    }}
                    className="flex max-w-[20rem] rounded-t-lg flex-row items-center justify-center w-40 h-10 border-2 border-black border-b-0 hover:cursor-pointer transition-all duration-300"
                    style={{
                        backgroundColor: props.currentLayerId === layer.Id ? layer.Color : 'white'
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