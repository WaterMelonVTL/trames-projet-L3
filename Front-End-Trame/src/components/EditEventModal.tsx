import React, { useState } from 'react'
import { Event } from '../types/types'

interface EditEventModalProps {
    event: Event
    onClose: () => void
    onUpdate: (updatedEvent: Event) => void
}

const EditEventModal: React.FC<EditEventModalProps> = ({ event, onClose, onUpdate }) => {
    const [name, setName] = useState(event.Name)
    const [date, setDate] = useState(formatDateForInput(event.Date))
    const [startHour, setStartHour] = useState(event.StartHour)
    const [endHour, setEndHour] = useState(event.EndHour)

    // Format date string to YYYY-MM-DD for input element
    function formatDateForInput(dateString: string): string {
        const date = new Date(dateString)
        return date.toISOString().split('T')[0]
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const response = await fetch(`http://localhost:3000/api/events/${event.Id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                Name: name, 
                Date: date,
                StartHour: startHour,
                EndHour: endHour
            })
        })
        if (response.ok) {
            const updatedEvent = { 
                ...event, 
                Name: name, 
                Date: date,
                StartHour: startHour,
                EndHour: endHour
            }
            onUpdate(updatedEvent)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white shadow-lg rounded-lg p-6 w-96">
                <h2 className="text-2xl font-semibold mb-6 text-center">Modifier l'événement</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Nom</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 w-full focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 w-full focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Heure de début</label>
                        <input
                            type="time"
                            value={startHour}
                            onChange={(e) => setStartHour(e.target.value)}
                            className="mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 w-full focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700">Heure de fin</label>
                        <input
                            type="time"
                            value={endHour}
                            onChange={(e) => setEndHour(e.target.value)}
                            className="mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 w-full focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md transition duration-300 hover:bg-gray-300"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-md transition duration-300 hover:bg-blue-600"
                        >
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditEventModal
