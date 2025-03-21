import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import fr from 'date-fns/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'fr-FR': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const messages = {
  next: 'Suivant',
  previous: 'Précédent',
  today: "Aujourd'hui",
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Heure',
  event: 'Événement'
};


const MyCalendar = ({ designatedDays }: { designatedDays: Date[] }) => {
  const events = designatedDays.map(day => ({
    title: 'Banalisé',
    start: day,
    end: day,
    allDay: true,
  }));

  return (
    <div style={{ height: '500px' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        culture="fr-FR"
        messages={messages}
      />
    </div>
  );
};

export default MyCalendar;
