import React, { useState, useEffect } from 'react';

interface EditUeModalProps {
  ue: any;
  onClose: () => void;
  onUpdate: (updatedUe: any) => void;
}

const EditUeModal: React.FC<EditUeModalProps> = ({ ue, onClose, onUpdate }) => {
  // Initialize all form fields with default values
  const [name, setName] = useState<string>(ue?.Name || '');
  const [color, setColor] = useState<string>(ue?.Color || '#FFFFFF');
  const [responsibleName, setResponsibleName] = useState<string>(ue?.ResponsibleName || '');
  const [totalVolumeCM, setTotalVolumeCM] = useState<number>(ue?.TotalHourVolume_CM || 0);
  const [totalVolumeTD, setTotalVolumeTD] = useState<number>(ue?.TotalHourVolume_TD || 0);
  const [totalVolumeTP, setTotalVolumeTP] = useState<number>(ue?.TotalHourVolume_TP || 0);
  
  // Explicitly initialize boolean fields to false if undefined
  const [tdNeedInformatized, setTdNeedInformatized] = useState<boolean>(
    ue?.TD_NeedInformaticRoom === true
  );
  const [tpNeedInformatized, setTpNeedInformatized] = useState<boolean>(
    ue?.TP_NeedInformaticRoom === true
  );

  // Update local state when ue prop changes
  useEffect(() => {
    if (ue) {
      setName(ue.Name || '');
      setColor(ue.Color || '#FFFFFF');
      setResponsibleName(ue.ResponsibleName || '');
      setTotalVolumeCM(ue.TotalHourVolume_CM || 0);
      setTotalVolumeTD(ue.TotalHourVolume_TD || 0);
      setTotalVolumeTP(ue.TotalHourVolume_TP || 0);
      setTdNeedInformatized(ue.TD_NeedInformaticRoom === true);
      setTpNeedInformatized(ue.TP_NeedInformaticRoom === true);
    }
  }, [ue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedUE = {
      ...ue,
      Name: name,
      Color: color, 
      ResponsibleName: responsibleName,
      TotalHourVolume_CM: totalVolumeCM,
      TotalHourVolume_TD: totalVolumeTD,
      TotalHourVolume_TP: totalVolumeTP,
      TD_NeedInformaticRoom: tdNeedInformatized,
      TP_NeedInformaticRoom: tpNeedInformatized
    };

    console.log("Updating UE with values:", updatedUE);
    
    try {
      const response = await fetch(`http://localhost:3000/api/ues/${ue.Id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ue: updatedUE })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Update successful:", result);
        onUpdate(updatedUE);
      } else {
        console.error("Failed to update UE:", await response.text());
      }
    } catch (error) {
      console.error("Error updating UE:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Modifier UE</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="name" className="mb-1 text-sm font-medium">
                Nom de l'UE
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded p-2"
                required
              />
            </div>
            
            <div className="flex flex-col">
              <label htmlFor="color" className="mb-1 text-sm font-medium">
                Couleur
              </label>
              <input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 border rounded"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="responsibleName" className="mb-1 text-sm font-medium">
                Prof responsable
              </label>
              <input
                id="responsibleName"
                type="text"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                className="border rounded p-2"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="totalVolumeCM" className="mb-1 text-sm font-medium">
                Total Heures CM
              </label>
              <input
                id="totalVolumeCM"
                type="number"
                value={totalVolumeCM}
                onChange={(e) => setTotalVolumeCM(parseInt(e.target.value) || 0)}
                className="border rounded p-2"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="totalVolumeTD" className="mb-1 text-sm font-medium">
                Total Heures TD
              </label>
              <input
                id="totalVolumeTD"
                type="number"
                value={totalVolumeTD}
                onChange={(e) => setTotalVolumeTD(parseInt(e.target.value) || 0)}
                className="border rounded p-2"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="totalVolumeTP" className="mb-1 text-sm font-medium">
                Total Heures TP
              </label>
              <input
                id="totalVolumeTP"
                type="number"
                value={totalVolumeTP}
                onChange={(e) => setTotalVolumeTP(parseInt(e.target.value) || 0)}
                className="border rounded p-2"
              />
            </div>

            <div className="flex items-center">
              <input
                id="tdNeedInformatized"
                type="checkbox"
                checked={tdNeedInformatized}
                onChange={(e) => setTdNeedInformatized(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="tdNeedInformatized" className="ml-2 text-sm">
                TD besoin salle informatisée
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="tpNeedInformatized"
                type="checkbox"
                checked={tpNeedInformatized}
                onChange={(e) => setTpNeedInformatized(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="tpNeedInformatized" className="ml-2 text-sm">
                TP besoin salle informatisée
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUeModal;
