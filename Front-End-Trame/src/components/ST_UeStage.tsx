import React, { useState, useEffect, useCallback, useRef } from 'react'
import ST_FileUploadModal from './ST_FileUploadModal'
import * as XLSX from 'xlsx'  // make sure to install xlsx package
import EditUeModal from './EditUeModal';

interface UeStageProps {
  trameId: string;
  index: number;
}

const ST_UeStage: React.FC<UeStageProps> = ({ trameId, index }) => {
  // New state for current layer selection
  const [layers, setLayers] = useState<any[]>([])
  const [currentLayerId, setCurrentLayerId] = useState<string>('')
  const [currentLayerName, setCurrentLayerName] = useState<string>('')

  // Reuse existing states
  const [isFileValid, setIsFileValid] = useState<boolean>(false)
  const [fileData, setFileData] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedUEs, setSelectedUEs] = useState<string[]>([])
  const [ueName, setUeName] = useState<string>('')
  const [ueColor, setUeColor] = useState<string>('#FFFFFF')
  const [ueProfResponsable, setUeProfResponsable] = useState<string>('')
  const [ues, setUes] = useState<any[]>([])
  const [trame, setTrame] = useState<any | null>(null)
  const [editingUE, setEditingUE] = useState<any | null>(null);

  // New states for manual UE creation inputs
  const [ueTotalVolumeCM, setUeTotalVolumeCM] = useState<number>(0)
  const [ueTotalVolumeTD, setUeTotalVolumeTD] = useState<number>(0)
  const [ueTotalVolumeTP, setUeTotalVolumeTP] = useState<number>(0)
  const [ueTDNeedInformatized, setUeTDNeedInformatized] = useState<boolean>(false)
  const [ueTPNeedInformatized, setUeTPNeedInformatized] = useState<boolean>(false)

  // New state for manual form toggle
  const [showManualForm, setShowManualForm] = useState<boolean>(false);

  // NEW loading state for file processing
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Fetch layers and set current layer from index (similar to group stage)
  useEffect(() => {
    const fetchLayers = async () => {
      const response = await fetch(`http://localhost:3000/api/layers/trame/${trameId}?withGroups=true`)
      if (response.ok) {
        const data = await response.json()
        setLayers(data)
        if (data[index]) {
          setCurrentLayerId(data[index].Id)
          setCurrentLayerName(data[index].Name)
        }
      }
    }
    fetchLayers()
  }, [trameId, index])

  // Fetch UEs for the current layer
  const fetchUes = async (layerId: string) => {
    const response = await fetch(`http://localhost:3000/api/ues/layer/${layerId}`)
    if (response.ok) {
      const data = await response.json()
      setUes(data)
    } else {
      console.error('Failed to fetch UEs for layer:', layerId)
    }
  }

  const fetchTrame = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/trames/${trameId}`)
      if (response.ok) {
        const fTrame = await response.json();
        setTrame(fTrame);
      }
    } catch (error) {
      console.error('Error fetching trame name:', error)
    }
  }

  useEffect(() => {
    fetchTrame()
  }, [trameId])

  useEffect(() => {
    if (currentLayerId) {
      fetchUes(currentLayerId)
    }
  }, [currentLayerId])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    resetFileState();
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setSelectedFile(file);
    }
  }

  useEffect(() => {
    if (selectedFile) {
      handleFileUpload();
    }
  }, [selectedFile])

  const handleFileUpload = async () => {
    if (!selectedFile) console.log('No file selected');
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const requiredColumns = [
        'Code UE',
        'Libellé long',
        'Effectifs 21-22',
        'Nb Heures - CM',
        'Nb Heures - TD',
        'Nb Heures - TP',
        'Nb Heures - terrain',
        'RESP_ELP'
      ];
      const firstRow = jsonData[0] as string[];
      const isValid = requiredColumns.every(col => firstRow.includes(col));
      if (!isValid) {
        alert('Fichier invalide : colonnes requises manquantes.');
        resetFileState();
        setIsLoading(false);
        return;
      }
      setIsFileValid(true);

      const processedData = new Map();
      await Promise.all(
        jsonData.slice(1).map(async (row: any) => {
          const codeUE = row[firstRow.indexOf('Code UE')];
          const respField = row[firstRow.indexOf('RESP_ELP')];
          if (respField) {
            const profName = respField.split('/')[0].trim();
            if (!processedData.has(codeUE)) { // Ensure uniqueness
              processedData.set(codeUE, {
                'Code UE': codeUE,
                'Nb Heures - CM': Math.round(row[firstRow.indexOf('Nb Heures - CM')]),
                'Nb Heures - TD': Math.round(row[firstRow.indexOf('Nb Heures - TD')]),
                'Nb Heures - TP': Math.round(row[firstRow.indexOf('Nb Heures - TP')]),
                'ResponsibleName': profName
              });
            }
          }
        })
      );
      const validData = Array.from(processedData.values());
      setFileData(validData);
      setIsLoading(false);
    };
    reader.onerror = () => {
      alert('Erreur lors du chargement du fichier.');
      resetFileState();
      setIsLoading(false);
    };
    reader.readAsArrayBuffer(selectedFile);
  }

  const resetFileState = () => {
    setIsFileValid(false)
    setFileData([])
    setSelectedFile(null)
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSearchQuery('')
  }

  // Add a ref for shift-click handling
  const lastChecked = useRef<number | null>(null);

  const filteredData = fileData.filter(ue =>
    ue['Code UE']?.toLowerCase().includes(searchQuery.toLowerCase())
  )


  // Replace the previous onCheckboxChange with the following handleCheckboxChange
  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    console.log('Checkbox change:', index);
    const ueCode = filteredData[index]['Code UE'];
    if (lastChecked.current !== null && e.nativeEvent.shiftKey) {
      setSelectedUEs(prev => {
        const start = Math.min(lastChecked.current!, index);
        const end = Math.max(lastChecked.current!, index);
        const newSelectedUEs = [...prev];
        for (let i = start; i <= end; i++) {
          const code = filteredData[i]['Code UE'];
          if (!newSelectedUEs.includes(code)) {
            newSelectedUEs.push(code);
          }
        }
        return newSelectedUEs;
      });
      return;
    }
    if (e.target.checked) {
      lastChecked.current = index;
      setSelectedUEs(prev => [...prev, ueCode]);
    } else {
      lastChecked.current = null;
      setSelectedUEs(prev => prev.filter(code => code !== ueCode));
    }
  }, [filteredData]);

  // New function to send a UE to the server with a responsible object
  const sendUEToServer = async (newUE: any) => {
    const response = await fetch('http://localhost:3000/api/ues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ue: newUE, user: { Id: 1 } })
    });
    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to add UE:', newUE.Name);
      return null;
    }
  };

  // New function to add multiple UEs. Uses layers[index].Id since index is available via props.
  const addUEs = async (uesToAdd: any[]) => {
    const newUEs = await Promise.all(uesToAdd.map((ue) => {
      const pastelColors = [
        '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFE4B5', '#E0BBE4',
        '#957DAD', '#D4A5A5', '#9CD1AE', '#F9C0C0', '#95B8D1',
        '#E8DFF5', '#FFE5B4', '#A8E6CF', '#FCD1D1', '#AEC6CF'
      ];

      return {
        Name: ue['Code UE'],
        TotalHourVolume_CM: ue['Nb Heures - CM'],
        TotalHourVolume_TD: ue['Nb Heures - TD'],
        TotalHourVolume_TP: ue['Nb Heures - TP'],
        ResponsibleName: ue['ResponsibleName'],
        Color: pastelColors[Math.floor(Math.random() * pastelColors.length)],
        LayerId: layers[index].Id
      };
    }));
    try {
      const responses = await Promise.all(newUEs.map(ue => sendUEToServer(ue)));
      const addedUEs = responses.filter(ue => ue !== null);
      setUes(prev => [...prev, ...addedUEs]);
    } catch (error) {
      console.error('Failed to add UEs:', error);
    }
    setSelectedUEs([]);
    closeModal();
  };

  // Update addSelectedUEs to use the new addUEs function
  const addSelectedUEs = () => {
    const uesToAdd = selectedUEs.map(ueCode => fileData.find(ue => ue['Code UE'] === ueCode)).filter(ue => ue !== undefined);
    console.log('UES to add:', uesToAdd);
    addUEs(uesToAdd);
  };

  // Update addAllFilteredUEs to use the new addUEs function
  const addAllFilteredUEs = () => {
    addUEs(filteredData);
  };

  // Updated addUE for manual creation - now sends a responsible object and logs the data
  const addUE = async () => {
    if (!ueName) return;
    
    // Create UE object with explicit boolean conversions
    const newUE = {
      Name: ueName,
      Color: ueColor,
      ResponsibleName: ueProfResponsable,
      TotalHourVolume_CM: ueTotalVolumeCM,
      TotalHourVolume_TD: ueTotalVolumeTD,
      TotalHourVolume_TP: ueTotalVolumeTP,
      TD_NeedInformaticRoom: ueTDNeedInformatized === true,
      TP_NeedInformaticRoom: ueTPNeedInformatized === true,
      LayerId: currentLayerId
    };
    
    console.log('Sending UE data to server:', newUE);
    
    const response = await fetch('http://localhost:3000/api/ues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ue: newUE,
        user: { Id: 1 }
      })
    });
    
    if (response.ok) {
      console.log('UE created successfully');
      // Clear form fields
      setUeName('');
      setUeColor('#FFFFFF');
      setUeProfResponsable('');
      setUeTotalVolumeCM(0);
      setUeTotalVolumeTD(0);
      setUeTotalVolumeTP(0);
      setUeTDNeedInformatized(false);
      setUeTPNeedInformatized(false);
      
      // Refresh the UEs for the current layer
      fetchUes(currentLayerId);
    } else {
      const errorData = await response.text();
      console.error('Failed to create UE:', errorData);
    }
  };

  // New function to remove a UE by id
  const removeUE = async (ueId: string | number) => {
    const response = await fetch(`http://localhost:3000/api/ues/${ueId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      setUes(prev => prev.filter(ue => ue.Id !== ueId));
    } else {
      console.error(`Failed to delete UE with id: ${ueId}`);
    }
  };

  // New function to open UE editing modal
  const openEditUeModal = (ue: any) => {
    setEditingUE(ue);
  };

  // New function to update UE after editing
  const handleUpdateUE = (updatedUE: any) => {
    setUes(prev => prev.map(ue => ue.Id === updatedUE.Id ? updatedUE : ue));
    setEditingUE(null);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">
        Ajouter UE pour : <span className="font-bold">{currentLayerName || 'Current Layer'}</span>
      </h1>
      <div className='flex items-center justify-between mb-6'>

        {/* File upload section */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
          <div className="flex flex-row items-center space-x-4">
            {/* Custom file select button */}
            <div>
              <input
                type="file"
                id="fileInput"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="fileInput"
                className="cursor-pointer flex items-center justify-center w-16 h-16 bg-gray-200 rounded-md hover:bg-gray-300"
                style = {{ backgroundColor: isFileValid ? '#10B981' : '#e5e7eb' }}
              > 
                {isLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-8 w-8 ${isFileValid? "text-white":"text-gray-600"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4a1 1 0 011-1h8a1 1 0 011 1v12m-8 4h8m-8-4h8" />
                  </svg>
                )}
              </label>
            </div>
            <div className="flex flex-col space-y-2 flex-grow">
              <span className="text-lg font-semibold text-gray-700">
                Importez des UEs en masse
              </span>
              <button
                onClick={openModal}
                disabled={!isFileValid}
                className="py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 
                           hover:from-blue-600 hover:to-purple-600 text-white font-medium 
                           rounded-md shadow-lg transform transition duration-300 hover:scale-105 disabled:opacity-50"
              >
                Ajouter des UEs
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center mx-4">
          <div className="relative h-32">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full border-l border-gray-300"></div>
            <div className="absolute left-1/2 font-bold top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-500">
              ou
            </div>
          </div>
        </div>
        {/* Toggle button for manual UE creation */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow-md w-1/2">
          <div className="flex flex-col space-y-2 flex-grow">
            <span className="text-lg font-semibold text-gray-700">Création manuelle</span>
            <button
              onClick={() => setShowManualForm(prev => !prev)}
              className="py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-md shadow-lg transform transition duration-300 hover:scale-105"
            >
              {showManualForm ? 'Cacher' : 'Afficher'}
            </button>
          </div>
        </div>
      </div>



      {/* Conditional manual UE creation form */}
      {showManualForm && (
        <div className="mb-6 transition-all duration-300 ease-in-out">
          <div className="bg-white shadow rounded p-4 max-w-lg mx-auto">
            <h2 className="text-xl font-semibold mb-4">Créer une UE manuellement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label htmlFor="ueNameInput" className="mb-1 text-sm font-medium">
                  Nom de l'UE
                </label>
                <input
                  type="text"
                  id="ueNameInput"
                  placeholder="Nom de l'UE"
                  value={ueName}
                  onChange={(e) => setUeName(e.target.value)}
                  className="border rounded p-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="ueColorInput" className="mb-1 text-sm font-medium">
                  Couleur
                </label>
                <input
                  type="color"
                  id="ueColorInput"
                  value={ueColor}
                  onChange={(e) => setUeColor(e.target.value)}
                  className="w-12 h-12 border rounded"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="ueProfResponsableInput" className="mb-1 text-sm font-medium">
                  Prof responsable
                </label>
                <input
                  type="text"
                  id="ueProfResponsableInput"
                  placeholder="Prof responsable"
                  value={ueProfResponsable}
                  onChange={(e) => setUeProfResponsable(e.target.value)}
                  className="border rounded p-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="ueVolumeCMInput" className="mb-1 text-sm font-medium">
                  Total Heures CM
                </label>
                <input
                  type="number"
                  id="ueVolumeCMInput"
                  placeholder="Total Heures CM"
                  value={ueTotalVolumeCM}
                  onChange={(e) => setUeTotalVolumeCM(parseInt(e.target.value))}
                  className="border rounded p-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="ueVolumeTDInput" className="mb-1 text-sm font-medium">
                  Total Heures TD
                </label>
                <input
                  type="number"
                  id="ueVolumeTDInput"
                  placeholder="Total Heures TD"
                  value={ueTotalVolumeTD}
                  onChange={(e) => setUeTotalVolumeTD(parseInt(e.target.value))}
                  className="border rounded p-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="ueVolumeTPInput" className="mb-1 text-sm font-medium">
                  Total Heures TP
                </label>
                <input
                  type="number"
                  id="ueVolumeTPInput"
                  placeholder="Total Heures TP"
                  value={ueTotalVolumeTP}
                  onChange={(e) => setUeTotalVolumeTP(parseInt(e.target.value))}
                  className="border rounded p-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="tdNeedInput"
                  checked={ueTDNeedInformatized}
                  onChange={(e) => setUeTDNeedInformatized(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="tdNeedInput" className="ml-2 text-sm">
                  TD besoin salle informatisée
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="tpNeedInput"
                  checked={ueTPNeedInformatized}
                  onChange={(e) => setUeTPNeedInformatized(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="tpNeedInput" className="ml-2 text-sm">
                  TP besoin salle informatisée
                </label>
              </div>
            </div>
            <button
              onClick={addUE}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Ajouter UE
            </button>
          </div>
        </div>
      )}
      {/* Rendering existing UEs */}
      <div className="mb-6">
        {ues.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 p-4">
            {ues.map((ue, idx) => (
              <div
                key={idx}
                className="p-4 rounded shadow-lg cursor-pointer transform transition flex items-center duration-200 hover:scale-105 hover:shadow-2xl"
                style={{ backgroundColor: ue.Color }}
                onClick={() => openEditUeModal(ue)}
              >
                <p className="text-lg font-medium">{ue.Name}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUE(ue.Id);
                  }}
                  className="ml-auto p-2 text-gray-600 hover:text-red-600 transition-colors duration-200 rounded-full hover:bg-red-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-gray-500">Aucune UE définie. Ajoutez votre première UE.</div>
        )}
      </div>
      {/* Rendering the modal for file upload selection */}
      {isModalOpen && (
        <ST_FileUploadModal
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredUEs={filteredData}
          selectedUEs={selectedUEs}
          onCheckboxChange={handleCheckboxChange}
          addSelectedUEs={addSelectedUEs}
          addAllFilteredUEs={addAllFilteredUEs}
          closeModal={closeModal}
        />
      )}
      {/* Rendering the UE editing modal */}
      {editingUE && (
        <EditUeModal
          ue={editingUE}
          onClose={() => setEditingUE(null)}
          onUpdate={handleUpdateUE}
        />
      )}
    </div>
  )
}

export default ST_UeStage
