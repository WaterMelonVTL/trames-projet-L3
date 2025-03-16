import React, { useState, useEffect } from 'react'
import { Event } from '../types/types'
import EditEventModal from './EditEventModal'

interface EventStageProps {
  trammeId: string;
}

const ST_EventStage: React.FC<EventStageProps> = ({ trammeId }) => {
  const [eventName, setEventName] = useState<string>('')
  const [eventDate, setEventDate] = useState<string>('')
  const [eventStartHour, setEventStartHour] = useState<string>('')
  const [eventEndHour, setEventEndHour] = useState<string>('')
  const [events, setEvents] = useState<Event[]>([])

  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch(`http://localhost:3000/api/events/tramme/${trammeId}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    }
    fetchEvents()
  }, [trammeId])

  const addEvent = async () => {
    if (!eventName || !eventDate || !eventStartHour || !eventEndHour) return

    const response = await fetch('http://localhost:3000/api/events/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({

        Name: eventName,
        Date: eventDate,
        StartHour: eventStartHour,
        EndHour: eventEndHour,
        TrammeId: trammeId

      })
    })
    if (response.ok) {
      const newEvent = await response.json()
      setEvents([...events, newEvent])
      setEventName('')
      setEventDate('')
      setEventStartHour('')
      setEventEndHour('')
    }
  }

  const removeEvent = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const eventToRemove = events[index]
    const response = await fetch(`http://localhost:3000/api/events/${eventToRemove.Id}`, {
      method: 'DELETE'
    })
    if (response.ok) {
      setEvents(events.filter((_, i) => i !== index))
    }
  }

  const openEditModal = (event: Event) => {
    setEditingEvent(event)
  }

  const handleUpdateEvent = (updatedEvent: Event) => {
    const newEvents = events.map(e => e.Id === updatedEvent.Id ? updatedEvent : e)
    setEvents(newEvents)
    setEditingEvent(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="p-4">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <label htmlFor="eventNameInput" className="text-xl font-semibold">
            Nom de l'événement:
          </label>
          <input
            type="text"
            id="eventNameInput"
            className="w-60 border-b-2 border-gray-300 focus:border-blue-500 outline-none p-2"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Nom de l'événement"
          />
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="eventDateInput" className="text-xl font-semibold">
            Date:
          </label>
          <input
            type="date"
            id="eventDateInput"
            className="w-60 border-b-2 border-gray-300 focus:border-blue-500 outline-none p-2"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="eventStartHourInput" className="text-xl font-semibold">
            Heure de début:
          </label>
          <input
            type="time"
            id="eventStartHourInput"
            className="w-60 border-b-2 border-gray-300 focus:border-blue-500 outline-none p-2"
            value={eventStartHour}
            onChange={(e) => setEventStartHour(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="eventEndHourInput" className="text-xl font-semibold">
            Heure de fin:
          </label>
          <input
            type="time"
            id="eventEndHourInput"
            className="w-60 border-b-2 border-gray-300 focus:border-blue-500 outline-none p-2"
            value={eventEndHour}
            onChange={(e) => setEventEndHour(e.target.value)}
          />
        </div>

        <button
          onClick={addEvent}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 self-end"
        >
          Ajouter un événement
        </button>
      </div>

      {events.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {events.map((event, index) => (
            <div
              key={index}
              className="p-4 rounded shadow-lg hover:scale-105 hover:shadow-2xl cursor-pointer bg-white"
              onClick={() => openEditModal(event)}
            >
              <h3 className="text-lg font-bold">{event.Name}</h3>
              <p className="text-sm text-gray-600">Date: {formatDate(event.Date)}</p>
              <p className="text-sm text-gray-600">De {event.StartHour} à {event.EndHour}</p>
              <button
                onClick={(e) => removeEvent(index, e)}
                className="mt-2 p-2 text-gray-600 hover:text-red-600 transition-colors duration-200 rounded-full hover:bg-red-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500">Aucun événement défini. Ajoutez votre premier événement.</div>
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onUpdate={handleUpdateEvent}
        />
      )}
    </div>
  )
}

export default ST_EventStage
