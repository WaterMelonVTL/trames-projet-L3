import React from 'react';

interface FileUploadModalProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filteredUEs: any[];
  selectedUEs: string[];
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>, ue: any) => void;
  addSelectedUEs: () => void;
  addAllFilteredUEs: () => void;
  closeModal: () => void;
}

const ST_FileUploadModal: React.FC<FileUploadModalProps> = ({
  searchQuery,
  setSearchQuery,
  filteredUEs,
  selectedUEs,
  onCheckboxChange,
  addSelectedUEs,
  addAllFilteredUEs,
  closeModal
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Rechercher des UEs</h2>
        <input
          type="text"
          placeholder="Rechercher..."
          className="border-b-2 border-black select-none outline-none p-2 mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="max-h-64 overflow-y-auto">
          {filteredUEs.map((ue, index) => (
            <div key={index} className="flex items-center justify-between mb-2">
              <input
                type="checkbox"
                checked={selectedUEs.includes(ue['Code UE'])}
                // Pass the ue object directly instead of index
                onChange={(e) => onCheckboxChange(e, index)}
              />
              <p className="flex-grow text-left ml-2">{ue['Code UE']}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-4 mt-4">
          <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" onClick={addSelectedUEs}>
            Ajouter sélectionnés
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" onClick={addAllFilteredUEs}>
            Ajouter tous
          </button>
          <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" onClick={closeModal}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
};

export default ST_FileUploadModal;