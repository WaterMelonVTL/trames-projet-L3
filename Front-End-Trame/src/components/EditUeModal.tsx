import React, { useState } from 'react';
import {api} from '../public/api/api';
interface EditUeModalProps {
  ue: any;
  onClose: () => void;
  onUpdate: (updatedUE: any) => void;
}

const EditUeModal: React.FC<EditUeModalProps> = ({ ue, onClose, onUpdate }) => {
  const [name, setName] = useState(ue.Name);
  const [color, setColor] = useState(ue.Color);
  const [responsible, setResponsible] = useState(ue.ResponsibleName);
  const [totalVolumeCM, setTotalVolumeCM] = useState(ue.TotalHourVolume_CM);
  const [totalVolumeTD, setTotalVolumeTD] = useState(ue.TotalHourVolume_TD);
  const [totalVolumeTP, setTotalVolumeTP] = useState(ue.TotalHourVolume_TP);
  const [tdInformatized, setTdInformatized] = useState(ue.TDNeedInformatized);
  const [tpInformatized, setTpInformatized] = useState(ue.TPNeedInformatized);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        // Replace fetch with api.put
        await api.put(`/ues/${ue.Id}`, {
            ue: {
                Name: name,
                Color: color,
                ResponsibleName: responsible,
                TotalHourVolume_CM: totalVolumeCM,
                TotalHourVolume_TD: totalVolumeTD,
                TotalHourVolume_TP: totalVolumeTP,
                TDNeedInformatized: tdInformatized,
                TPNeedInformatized: tpInformatized
            }
        });

        const updatedUE = { 
            ...ue, 
            Name: name, 
            Color: color, 
            ResponsibleName: responsible, 
            TotalHourVolume_CM: totalVolumeCM, 
            TotalHourVolume_TD: totalVolumeTD, 
            TotalHourVolume_TP: totalVolumeTP, 
            TDNeedInformatized: tdInformatized, 
            TPNeedInformatized: tpInformatized 
        };
        onUpdate(updatedUE);
    } catch (error) {
        console.error('Failed to update UE:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white shadow-lg rounded-lg p-6 w-96">
        <h2 className="text-2xl font-semibold mb-6 text-center">Éditer l'UE</h2>
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
            <label className="block text-sm font-medium text-gray-700">Couleur</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-1 border border-gray-300 rounded-md py-2 px-3 w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Prof Responsable</label>
            <input
              type="text"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              className="mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">CM</label>
              <input
                type="number"
                value={totalVolumeCM}
                onChange={(e) => setTotalVolumeCM(parseInt(e.target.value))}
                className="mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 w-full focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">TD</label>
              <input
                type="number"
                value={totalVolumeTD}
                onChange={(e) => setTotalVolumeTD(parseInt(e.target.value))}
                className="mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 w-full focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">TP</label>
              <input
                type="number"
                value={totalVolumeTP}
                onChange={(e) => setTotalVolumeTP(parseInt(e.target.value))}
                className="mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 w-full focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="tdCheck"
              checked={tdInformatized}
              onChange={(e) => setTdInformatized(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="tdCheck" className="ml-2 text-sm text-gray-700">TD besoin salle informatisée</label>
          </div>
          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="tpCheck"
              checked={tpInformatized}
              onChange={(e) => setTpInformatized(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="tpCheck" className="ml-2 text-sm text-gray-700">TP besoin salle informatisée</label>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md transition duration-300 hover:bg-gray-300"
            >
              Annuler
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md transition duration-300 hover:bg-blue-600">
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUeModal;
