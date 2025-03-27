import React, { useState, useEffect } from 'react'
import DatePicker, {DateObject} from "react-multi-date-picker";
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css
import { api } from '../public/api/api.js'
import Icon from 'react-multi-date-picker/components/icon';
import MyCalendar from './MyCalendar.js';




interface DateStageProps {
    trameId: string;
    startDate: Date;
    endDate: Date;
    designatedDays: Date[];
}

const ST_DateStage: React.FC<DateStageProps> = ({ trameId }) => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [designatedDays, setDesignatedDays] = useState<Date[]>([]);  
  const [showCalendar, setShowCalendar] = useState(false);
  // API pour mettre à jour les dates lors de chaque modification
  const updateDateRange = async (newStartDate: Date, newEndDate: Date) => {
    try {
        await api.put(`/trames/${trameId}`, {
            StartDate: newStartDate,
            EndDate: newEndDate
        });
        console.log('Mise à jour des dates :', {startDate: newStartDate, endDate : newEndDate});
    } catch (error) {
        console.log('Erreur lors de la mise à jour', error);
    }
  };

   // Handler for the date input changes
   const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = new Date(e.target.value);
    setStartDate(newStart);
    updateDateRange(newStart, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = new Date(e.target.value);
    setEndDate(newEnd);
    updateDateRange(startDate, newEnd);
  };

  const fetchDates = async () => {
    try {
      const trame = await api.get(`/trames/${trameId}`);
      console.log('Raw API dates:', trame.StartDate, trame.EndDate);
      const newStartDate = new Date(trame.StartDate);
      const newEndDate = new Date(trame.EndDate);
  
      if (isNaN(newStartDate.getTime()) || newStartDate.getTime() === 0) {
        console.warn("Invalid or default start date from API, using today's date");
        setStartDate(new Date());
      } else {
        setStartDate(newStartDate);
      }
  
      if (isNaN(newEndDate.getTime()) || newEndDate.getTime() === 0) {
        console.warn("Invalid or default end date from API, using today's date");
        setEndDate(new Date());
      } else {
        setEndDate(newEndDate);
      }
    } catch (error) {
      console.error('Error fetching trame date data:', error);
    }
  };
  


  // Fonction helper pour générer les jours banalisés dans une intervalle lorsque l'option de "range" est utilisée
  function expandDates(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    
    // Ici pour trouver le bon ordre
    const current = new Date(Math.min(start.getTime(), end.getTime()));
    const last = new Date(Math.max(start.getTime(), end.getTime()));

    while (current <= last) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  // API pour mettre à jour les jours banalisés
    const updateDesignatedDays = async (newDesignatedDays: Date[]) => {
        try {
            await api.put('/trames/addDesignatedDays', { trameId, designatedDays: newDesignatedDays });
            console.log("MAJ jours banalisés :", newDesignatedDays);
        } catch (error) {
            console.error("Erreur MAJ jours banalisés :", error);
        }
    }
    
    // Handler pour la MAJ jours banalisés
    function handleDesignatedDaysChange(values: DateObject[][] | DateObject[] | DateObject) {
      let expandedDates: Date[] = [];
    
      if (Array.isArray(values)) {
        if (Array.isArray(values[0])) {
          // Premier cas : DateObject[][], càd plusieurs intervalles
          const multiRange = values as DateObject[][];
    
          // Pour chaque sous liste/array
          multiRange.forEach(rangeArray => {
            // Si on a deux dates choisies, on les étend/expand
            if (rangeArray.length >= 2) {
              const start = rangeArray[0].toDate();
              const end = rangeArray[1].toDate();
              expandedDates.push(...expandDates(start, end));
            } else if (rangeArray.length === 1) {
              // Only one day selected in that range
              expandedDates.push(rangeArray[0].toDate());
            }
          });
        } else {
          // Deuxième cas : DateObject[], un seul range ou jours multiples
          const singleRange = values as DateObject[];
          if (singleRange.length === 2) {
            // Si 2 => expand
            const start = singleRange[0].toDate();
            const end = singleRange[1].toDate();
            expandedDates.push(...expandDates(start, end));
          } else {
            // 1 ou plus de jours multiples
            singleRange.forEach(obj => {
              expandedDates.push(obj.toDate());
            });
          }
        }
      } else {
        // Dernier cas : un seul objet DateObject[]
        expandedDates.push(values.toDate());
      }
    
      // Suppression des duplicats
      const uniqueTimestamps = [...new Set(expandedDates.map(d => d.getTime()))];
      const finalDates = uniqueTimestamps.map(ts => new Date(ts));

      setDesignatedDays(finalDates);
      updateDesignatedDays(finalDates);
    }

    async function fetchDesignatedDays() {
      try {
        const dDaysResponse = await api.get(`/trames/${trameId}/designatedDays`);
        const dDays = dDaysResponse.map((d: any) => new Date(d.Day));
        setDesignatedDays(dDays);
      } catch (error) {
        console.error("Error fetching designated days:", error);
      }
    }
    
    useEffect(() => {
      fetchDates();
      fetchDesignatedDays();
    }, [trameId]);

    // Function to clear designated days
    const clearDesignatedDays = async () => {
      try {
        await api.put('/trames/addDesignatedDays', { trameId, designatedDays: [] });
        setDesignatedDays([]);
        console.log("All designated days cleared.");
      } catch (error) {
        console.error("Error clearing designated days:", error);
      }
    };


  return (
    <div className="flex flex-col items-center gap-6 mb-8">
    {/* Date inputs for start and end */}
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-lg font-semibold">Sélectionnez la date de début et la date de fin</h2>
      <div className="flex gap-4">
        <div>
          <label className="block mb-1">Date de début:</label>
          <input
            type="date"
            value={startDate.toISOString().split('T')[0]}
            onChange={handleStartDateChange}
            className="border p-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Date de fin:</label>
          <input
            type="date"
            value={endDate.toISOString().split('T')[0]}
            onChange={handleEndDateChange}
            className="border p-2 rounded"
          />
        </div>
      </div>
    </div>

        {/* Calendrier des jours banalisés */}

        <div>
            <h2 className="text-lg font-semibold mb-2">Veuillez sélectionner les jours banalisés</h2>
            <DatePicker
                onChange={(handleDesignatedDaysChange)}
                multiple
                range
                sort
                render={<Icon/>}
                weekStartDayIndex={1}
            />


        </div>


      {/* New calendar view to display the selected days */}
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {showCalendar ? 'Masquer le calendrier' : 'Afficher le calendrier'}
      </button>
      {showCalendar && (
        <div className="mt-4">
          <MyCalendar designatedDays={designatedDays} />
          <button
        onClick={clearDesignatedDays}
        className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Tout supprimer
        </button>

        </div>
        
      )}

      
    </div>
);

}

export default ST_DateStage;
