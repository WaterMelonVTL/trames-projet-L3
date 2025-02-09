import React, { useState, useEffect, useCallback, useRef } from 'react'
import ST_FileUploadModal from './ST_FileUploadModal'
import * as XLSX from 'xlsx'  // make sure to install xlsx package

interface UeStageProps {
  trammeId: string;
  index: number;
}

const ST_UeStage: React.FC<UeStageProps> = ({ trammeId, index }) => {
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
  const [tramme, setTramme] = useState<any | null>(null)

  // Fetch layers and set current layer from index (similar to group stage)
  useEffect(() => {
    const fetchLayers = async () => {
      const response = await fetch(`http://localhost:3000/api/layers/tramme/${trammeId}?withGroups=true`)
      if(response.ok){
        const data = await response.json()
        setLayers(data)
        if(data[index]){
          setCurrentLayerId(data[index].Id)
          setCurrentLayerName(data[index].Name)
        }
      }
    }
    fetchLayers()
  }, [trammeId, index])

  // Fetch UEs for the current layer
  const fetchUes = async (layerId: string) => {
    const response = await fetch(`http://localhost:3000/api/ues/layer/${layerId}`)
    if(response.ok){
      const data = await response.json()
      setUes(data)
    } else {
      console.error('Failed to fetch UEs for layer:', layerId)
    }
  }

  const fetchTramme = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/trammes/${trammeId}`)
      if (response.ok) {
        const fTramme = await response.json();
        setTramme(fTramme);
      }
    } catch (error) {
      console.error('Error fetching tramme name:', error)
    }
  }

  useEffect(() => {
    fetchTramme()
  }, [trammeId])

  useEffect(() => {
    if(currentLayerId){
      fetchUes(currentLayerId)
    }
  }, [currentLayerId])

  // ...existing file upload and processing code...
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ...existing code...
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleFileUpload = async () => {
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
      console.log('First Row:', firstRow);
      console.log('Required Columns:', requiredColumns);
      const isValid = requiredColumns.every(col => firstRow.includes(col));
      if (!isValid) {
        console.error('File is invalid. Missing required columns.');
        setIsFileValid(false);
        return;
      } else {
        console.log('File is valid');
        setIsFileValid(true);
      }

      const processedData = new Map();
      await Promise.all(
        jsonData.slice(1).map(async (row: any) => {
          const codeUE = row[firstRow.indexOf('Code UE')];
          const respField = row[firstRow.indexOf('RESP_ELP')];
          if (respField) {
            const profName = respField.split('/')[0].trim();
            const responsibleId = await getProfIdByFullName(profName);
            if (responsibleId) {
              if (!processedData.has(codeUE)) { // Ensure uniqueness
                processedData.set(codeUE, {
                  'Code UE': codeUE,
                  'Nb Heures - CM': Math.round(row[firstRow.indexOf('Nb Heures - CM')]),
                  'Nb Heures - TD': Math.round(row[firstRow.indexOf('Nb Heures - TD')]),
                  'Nb Heures - TP': Math.round(row[firstRow.indexOf('Nb Heures - TP')]),
                  'ResponsibleId': responsibleId
                });
              }
            } else {
              console.error(`Responsible ${profName} not found for UE ${codeUE}`);
            }
          }
        })
      );
      const validData = Array.from(processedData.values());
      setFileData(validData);
      console.log('Processed Data:', validData);
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

  const searchProfs = async (query: string) => {
    const searchQuery = query === '' ? '%25all%25' : query;
    console.log("searching for profs with query:", searchQuery);
    try {
      const response = await fetch(`http://localhost:3000/api/profs/search/${tramme.ContextId}/${searchQuery}`);
      if (response.ok) {
        const profsData = await response.json();
        return profsData;
      } else {
        console.error("Error searching profs:", response.statusText);
        return [];
      }
    } catch (error) {
      console.error("Error searching profs:", error);
      return [];
    }
  };

  // New function to get professor ID by full name (assumes searchProfs is defined)
  const getProfIdByFullName = async (fullName: string) => {
    const profsData = await searchProfs(fullName);
    const prof = profsData.find((prof: any) => prof.FullName === fullName);
    return prof ? prof.Id : null;
  };

  // New function to send a UE to the server
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
    const newUEs = await Promise.all(uesToAdd.map(async (ue) => {
      const pastelColors = [
        '#FFB3BA', // pastel pink
        '#BAFFC9', // pastel green
        '#BAE1FF', // pastel blue
        '#FFE4B5', // pastel orange
        '#E0BBE4', // pastel purple
        '#957DAD', // pastel lavender
        '#D4A5A5', // pastel rose
        '#9CD1AE', // pastel sage
        '#F9C0C0', // pastel coral
        '#95B8D1', // pastel sky blue
        '#E8DFF5', // pastel periwinkle
        '#FFE5B4', // pastel peach
        '#A8E6CF', // pastel mint
        '#FCD1D1', // pastel salmon
        '#AEC6CF'  // pastel steel blue
      ];
      
      return {
        Name: ue['Code UE'],
        TotalHourVolume_CM: ue['Nb Heures - CM'],
        TotalHourVolume_TD: ue['Nb Heures - TD'],
        TotalHourVolume_TP: ue['Nb Heures - TP'],
        ResponsibleId: ue['ResponsibleId'],
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

  const addUE = async () => {
    if (!ueName) return
    const response = await fetch('http://localhost:3000/api/ues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ue: { Name: ueName, Color: ueColor, ResponsibleId: ueProfResponsable }, user: { Id: 1 } })
    })
    if (response.ok) {
      fetchUes(currentLayerId)
    }
  }


  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">
        Ajouter UE pour : <span className="font-bold">{currentLayerName || 'Current Layer'}</span>
      </h1>
      {/* ...existing file upload and creation UI... */}
      <div className="flex flex-col items-center justify-between mb-6">
        {!isFileValid ? (
          <div className="mb-4">
            <label htmlFor="fileInput" className="block text-lg font-medium mb-2">
              Ajouter en masse via un fichier :
            </label>
            <input type="file" id="fileInput" onChange={handleFileChange} className="mb-2" />
            <button onClick={handleFileUpload} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
              Upload
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <button onClick={openModal} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2">
              Rechercher et ajouter des UEs
            </button>
            <button onClick={resetFileState} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">
              Changer de fichier
            </button>
          </div>
        )}
        <div className="flex flex-col w-full max-w-md space-y-4">
          <input type="text" id="ueNameInput" placeholder="Nom de l'UE" value={ueName} onChange={(e) => setUeName(e.target.value)} className="border-b-2 border-gray-300 focus:border-blue-500 outline-none p-2 text-lg" />
          <input type="color" id="ueColorInput" value={ueColor} onChange={(e) => setUeColor(e.target.value)} className="w-12 h-12" />
          <input type="text" id="ueProfResponsableInput" placeholder="Prof responsable" value={ueProfResponsable} onChange={(e) => setUeProfResponsable(e.target.value)} className="border-b-2 border-gray-300 focus:border-blue-500 outline-none p-2 text-lg" />
          <button onClick={addUE} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            +
          </button>
        </div>
      </div>
      {ues.length > 0 ? (
        <div className="grid grid-cols-3 gap-4 p-4">
          {ues.map((ue, index) => (
            <div key={index} className="p-4 rounded shadow" style={{ backgroundColor: ue.Color }}>
              <p className="text-lg font-medium">{ue.Name}</p>
              <button onClick={() => {/* ...delete UE logic... */}} className="mt-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                X
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-gray-500">Aucune UE définie. Ajoutez votre première UE.</div>
      )}
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
    </div>
  )
}

export default ST_UeStage
