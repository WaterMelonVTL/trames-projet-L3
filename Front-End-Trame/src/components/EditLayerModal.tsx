import React, { useState } from 'react'
import { Layer } from '../types/types'
import {api} from '../public/api/api.js' // Import the api module

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
        try {
            // Replace fetch with api.put
            await api.put(`/layers/${layer.Id}`, {
                Name: name,
                Color: color
            });

            const updatedLayer = { ...layer, Name: name, Color: color }
            onUpdate(updatedLayer)

        } catch (error) {
            console.error('Failed to update layer:', error);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white shadow-lg rounded-lg p-6 w-96">
                <h2 className="text-2xl font-semibold mb-6 text-center">Edit Layer</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 w-full focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700">Color</label>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="mt-1 border border-gray-300 rounded-md py-2 px-3 w-full focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md transition duration-300 hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-md transition duration-300 hover:bg-blue-600"
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
