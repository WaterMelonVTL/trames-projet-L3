import React, { useState } from 'react'
import { Layer } from '../types/types'

interface EditLayerModalProps {
    layer: Layer
    onClose: () => void
    onUpdate: (updatedLayer: Layer) => void
}

const EditLayerModal: React.FC<EditLayerModalProps> = ({ layer, onClose, onUpdate }) => {
    const [name, setName] = useState(layer.Name)
    const [color, setColor] = useState(layer.Color)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const response = await fetch(`http://localhost:3000/api/layers/${layer.Id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Name: name, Color: color })
        })
        if (response.ok) {
            const updatedLayer = { ...layer, Name: name, Color: color }
            onUpdate(updatedLayer)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white rounded p-6 w-80">
                <h2 className="text-xl font-bold mb-4">Edit Layer</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border p-2 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Color</label>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="border p-2 w-full"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mr-2 px-4 py-1 border rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-1 bg-blue-500 text-white rounded"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditLayerModal
