import React, { useState, useEffect } from 'react'
import { DateRange } from 'react-date-range';
import DatePicker, {DateObject} from "react-multi-date-picker";
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css
import AnalogTimePicker from 'react-multi-date-picker/plugins/analog_time_picker';
import { api } from '../public/api/api.js'

interface DateStageProps {
    trammeId: string;
    startDate: Date;
    endDate: Date;
    designatedDays: Date[];
}

const ST_DateStage: React.FC<DateStageProps> = ({ trammeId }) => {

  const [dateRange, setDateRange] = useState({
  startDate: new Date(),
  endDate: new Date(),
  key: 'selection'
  });

  const [designatedDays, setDesignatedDays] = useState<Date[]>([]);  

  // API pour mettre à jour les dates lors de chaque modification
  const updateDateRange = async (newStartDate: Date, newEndDate: Date) => {
    try {
        await api.put(`/trammes/${trammeId}`, {
            StartDate: newStartDate,
            EndDate: newEndDate
        });
        console.log('Mise à jour des dates :', {startDate: newStartDate, endDate : newEndDate});
    } catch (error) {
        console.log('Erreur lors de la mise à jour', error);
    }
  };

  // Handler pour le changement des dates
  const handleUpdateDateRange = (ranges: any) => {
    const {startDate, endDate} = ranges.selection;
    setDateRange({...dateRange, startDate, endDate});
    updateDateRange(startDate, endDate);
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
            await api.put('/trammes/addDesignatedDays', { trammeId, designatedDays: newDesignatedDays });
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


  return (
    <div className="flex flex-col items-center gap-6 mb-8">
        {/* Calendrier pour dates de début et de fin */}
        <div>
            <h2 className="text-lg font-semibold mb-2">Veuillez sélectionner les dates de début et de fin</h2>
            <DateRange
                ranges={[dateRange]}
                onChange={(handleUpdateDateRange)}
            />
        </div>

        {/* Calendrier des jours banalisés */}

        <div>
            <h2 className="text-lg font-semibold mb-2">Veuillez sélectionner les jours banalisés</h2>
            <DatePicker
                onChange={(handleDesignatedDaysChange)}
                multiple
                range
                sort
            />
        </div>
        <div>
        <p>Jours banalisés:</p>
        <ul>
          {designatedDays.map((d, i) => (
            <li key={i}>{d.toDateString()}</li>
          ))}
        </ul>
      </div>
    </div>
);

}

export default ST_DateStage;
