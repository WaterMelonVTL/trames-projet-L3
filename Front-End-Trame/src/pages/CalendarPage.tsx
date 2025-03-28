import React, { useState, useEffect } from 'react'
import CalendarFrame from '../components/CalendarFrame.js'
import CalendarCoursSelection from '../components/CalendarCoursSelection.js'
import EcuItem from '../components/EcuItem.js';
import { Course, UE, Layer, Trame } from '../types/types.js';
import { useLocation, useSearchParams } from 'react-router-dom'; // <-- added useSearchParams
import CalendarLayerSelection from '../components/CalendarLayerSelection.js';
import { api } from '../public/api/api.js'; // <-- added api import
import CalendarPoolSelection from '../components/CalendarPoolSelection.js';
import ExcelJS from 'exceljs';
import LoadingAnimation from '../components/LoadingAnimation.js';
import {
  useTrame,
  useLayers,
  useUEsByLayer,
  useGroupsByLayer,
  useClassesForWeek,
  useAddCourse,
  useDeleteCourse,
  useUpdateLayer,
  getMonday
} from '../hooks/useCalendarData.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

// Wrap the component with QueryClientProvider
function CalendarPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <CalendarPageContent />
    </QueryClientProvider>
  );
}

function CalendarPageContent() {
  // Retrieve date from url query parameter
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const initialDate = dateParam ? getMonday(new Date(dateParam)) : getMonday(new Date('2001-01-01'));

  // Use the date from the url if present or default value
  const [defaultDate, setDefaultDate] = useState<Date>(initialDate);

  const [currentCours, setCurrentCours] = useState<Course | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const location = useLocation();
  const trameId = location.pathname.split('/').pop() || '';

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedCourseType, setSelectedCourseType] = useState<string | null>(null);
  const [currentLayerId, setCurrentLayerId] = useState<number | null>(null);
  const [poolRefreshCounter, setPoolRefreshCounter] = useState<number>(0);

  const [loadingPercentage, setLoadingPercentage] = useState<number | undefined>(undefined);

  // Use React Query hooks for data fetching
  const { data: trameData, isLoading: isTrameLoading } = useTrame(trameId);
  const { data: layers = [], isLoading: isLayersLoading } = useLayers(trameId);
  const updateLayerMutation = useUpdateLayer();

  // Set initial layer ID when layers are loaded
  useEffect(() => {
    if (layers?.length > 0 && !currentLayerId) {
      setCurrentLayerId(layers[0].Id);
    }
  }, [layers]);

  // Fetch UEs for the current layer
  const { data: ues = [] } = useUEsByLayer(currentLayerId);

  // Group UEs by layer ID
  const uesByLayer = React.useMemo(() => {
    if (!layers || !ues) return {};

    return layers.reduce((acc: { [key: string]: UE[] }, layer: Layer) => {
      acc[layer.Id] = ues.filter((ue: UE) => ue.LayerId === layer.Id);
      return acc;
    }, {} as { [key: string]: UE[] });
  }, [layers, ues]);

  // Fetch groups for the current layer
  const { data: groups = [] } = useGroupsByLayer(currentLayerId);

  // Fetch classes for the current week
  const {
    data: weekClasses = [],
    isLoading: isClassesLoading
  } = useClassesForWeek(defaultDate, trameId, currentLayerId);

  // Filter courses by selected group and course type
  const filteredCours = React.useMemo(() => {
    let filtered = weekClasses;

    // Filter by group if one is selected
    if (selectedGroupId !== null) {
      filtered = filtered.filter(course =>
        course.Groups && course.Groups.some(group => group.Id === selectedGroupId)
      );
    }

    // Filter by course type if one is selected
    if (selectedCourseType !== null) {
      filtered = filtered.filter(course => course.Type === selectedCourseType);
    }

    return filtered;
  }, [weekClasses, selectedGroupId, selectedCourseType]);

  // Use the mutation hook for adding courses
  const addCourseMutation = useAddCourse();

  // Add the deletion mutation hook
  const deleteCourseMutation = useDeleteCourse();

  // Helper function to update both state and URL query
  function updateDate(newDate: Date) {
    // Format date in local time (YYYY-MM-DD)
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(newDate.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;
    setSearchParams({ date });
  }

  // AddCours function using the mutation
  async function AddCours(course: Course, date: string, time: string) {
    let selectedGroups;

    if (course.Groups) {
      selectedGroups = course.Groups;
    } else if (selectedGroupId !== null) {
      const selectedGroup = groups.find(group => group.Id === selectedGroupId);
      if (selectedGroup) {
        selectedGroups = [selectedGroup];
      } else {
        console.error("Selected group not found in loaded groups");
        return;
      }
    } else {
      selectedGroups = await api.cache.getGroupsByLayer(currentLayerId, true);
    }

    if (!selectedGroups || selectedGroups.length === 0) {
      console.error("No groups selected for the course");
      return;
    }

    try {
      // Check if this is a move operation (course has originalId)
      const isMoving = course.originalId !== undefined;

      await addCourseMutation.mutateAsync({
        course: {
          UEId: course.UEId,
          Type: course.Type,
          Date: date,
          StartHour: time,
          length: course.length,
        },
        groups: selectedGroups,
        separate: (course.Type === 'TD' || course.Type === 'TP') && course.Id === -1,
        trameId,
        layerId: currentLayerId,
        isMoving,
        originalId: course.originalId
      });

      // Trigger refresh for CalendarPoolSelection
      setPoolRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error('Failed to add the course', error);
    }
  }

  // Create a function to handle course deletion
  const handleDeleteCourse = (courseId: number | string, date: string, forMoving = false) => {
    try {
      // Guard against undefined or invalid IDs
      if (!courseId) {
        console.error("Attempted to delete course with invalid ID:", courseId);
        return;
      }
      setPoolRefreshCounter(prev => prev + 1);

      console.log(`CalendarPage deleting course ${courseId}, isMoving=${forMoving}`);

      deleteCourseMutation.mutate({
        courseId,
        trameId,
        layerId: currentLayerId,
        date,
        isMoving: forMoving,
        setPoolRefreshCounter  
      }, {
        // Add onSuccess callback here to handle the successful deletion
        onSuccess: () => {
          // Only update currentCours if this is a move operation
          if (forMoving && currentCours) {
            console.log(`Setting originalId=${courseId} for current course`);
            setCurrentCours({
              ...currentCours,
              originalId: courseId
            });
          }

          // For deletes, the pool refresh is now handled inside the mutation
        },

        // Additional error handling 
        onError: (error) => {
          console.error("Error deleting course:", error);
          // Consider showing a toast or alert to the user
        }
      });
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  // Navigation functions
  const nextWeek = () => {
    const newDate = getMonday(defaultDate);
    newDate.setDate(newDate.getDate() + 7);
    updateDate(newDate);
  }

  const previousWeek = () => {
    const newDate = getMonday(defaultDate);
    newDate.setDate(newDate.getDate() - 7);
    updateDate(newDate);
  }

  const resetToBaseline = () => {
    updateDate(new Date('2001-01-01'));
  }

  const goToFirstWeek = () => {
    if (trameData) updateDate(getMonday(new Date(trameData.StartDate)));
  }

  const goToLastWeek = () => {
    if (trameData) updateDate(getMonday(new Date(trameData.EndDate)));
  }

  async function duplicate() {
    setIsLoading("Trame en cours de génération");
    setLoadingPercentage(0);
    
    // Start a polling interval to check progress
    const progressInterval = setInterval(async () => {
      try {
        const progressData = await api.get(`/trames/duplicate-progress/${trameId}`);
        if (progressData) {
          // Update percentage for progress bar
          setLoadingPercentage(progressData.percentageTotal || 0);
          
          // Update loading text based on state
          const state = progressData.state || 'initialisation';
          const layer = progressData.currentLayer ? ` - ${progressData.currentLayer}` : '';
          const percentage = progressData.percentageTotal ? ` (${progressData.percentageTotal}%)` : '';
          setLoadingPercentage(progressData.percentageTotal || 0);
          let statusMessage;
          switch(state) {
            case 'initialisation':
              statusMessage = "Initialisation de la génération...";
              break;
            case 'chargement des données':
              statusMessage = "Chargement des données...";
              break;
            case 'chargement des couches':
              statusMessage = "Chargement des couches...";
              break;
            case 'préparation de la génération':
              statusMessage = "Préparation de la génération...";
              break;
            case 'chargement des UEs':
              statusMessage = `Chargement des UEs${layer}`;
              break;
            case 'préparation des cours':
              statusMessage = `Préparation des cours${layer}`;
              break;
            case 'génération des jours':
              statusMessage = `Génération des jours${layer}${percentage}`;
              break;
            case 'mise à jour des heures restantes dans la base de données':
              statusMessage = `Mise à jour des heures restantes${layer}`;
              break;
            case 'finalisation':
              statusMessage = "Finalisation de la génération...";
              break;
            case 'erreur':
              statusMessage = "Une erreur est survenue durant la génération";
              break;
            default:
              statusMessage = `${state}${layer}${percentage}`;
          }
          
          setIsLoading(statusMessage);
          
          // Stop polling if we're done or there's an error
          if (state === 'finalisation' || state === 'erreur' || progressData.percentageTotal === 100) {
            if (state === 'erreur') {
              setTimeout(() => setIsLoading(null), 1000);
              clearInterval(progressInterval);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    }, 500); // Check every 500ms
    
    try {
      await api.delete("/trames/clear-courses/" + trameId);
      let newDate = await api.post(`/trames/duplicate/${trameId}`);
      
      // Clear the interval once the main request completes
      clearInterval(progressInterval);
      
      newDate = new Date(newDate);
      if (newDate.getDay() !== 1) {
        newDate = getMonday(newDate);
      }
      queryClient.invalidateQueries({ queryKey: ['classes'] });

      updateDate(newDate);
      queryClient.invalidateQueries({ queryKey: ['classes'] });

      window.location.reload(); // IMPORTANT TO AVOID GHOST CLASSES WITH UNPREDICTABLE BEHAVIOR
      setIsLoading("Génération terminée, vous allez être redirigé");

    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error duplicating trame:", error);
      setIsLoading("Erreur lors de la génération");
      setTimeout(() => setIsLoading(null), 3000);
    }
  }

  // Keep track of loading state
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Handle mouse movement for drag and drop
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Update default date when URL params change
  useEffect(() => {
    const param = searchParams.get("date");
    if (param) {
      setDefaultDate(getMonday(new Date(param)));
    } else {
      setDefaultDate(getMonday(new Date('2001-01-01')));
    }
  }, [searchParams]);

  // Display loading animation if data is loading
  const layerColors = layers.map((layer) => layer.Color);
  if (isLoading || isTrameLoading || isLayersLoading) {
    return <LoadingAnimation texte={isLoading || "Chargement..."} colors={layerColors} percentage={loadingPercentage}/>;
  }

  const handleExportWeeks = async () => {
    if (!trameData) {
      alert('No trame data found.');
      return;
    }
    setIsLoading("Exportation en cours");

    const duplicateStart = new Date(trameData.StartDate);
    const duplicateEnd = new Date(trameData.EndDate);
    if (duplicateStart && duplicateEnd) {
      try {
        // Call the new server endpoint to get the weeks data
        const weeks = await api.post('/trames/export-excel', {
          trameId,
          layerId: currentLayerId,
          startDate: duplicateStart.toISOString(),
          endDate: duplicateEnd.toISOString()
        });
        
        generateExcel(weeks);
      } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Failed to export data');
        setIsLoading(null);
      }
    } else {
      setIsLoading(null);
      alert('Please select both start and end weeks.');
    }
  };

  // Helper function to format time from "8:00" to "8h00"
  const formatTimeToFrench = (timeString: string): string => {
    if (!timeString) return '';
    
    // If the time is already in the correct format, return it
    // But first make sure it doesn't contain seconds
    if (timeString.includes('h')) {
      // Remove any seconds if present (e.g. "8h00:00" becomes "8h00")
      const parts = timeString.split(':');
      return parts[0]; // Take only the part before any colon
    }
    
    // Handle "HH:MM:SS" format by removing seconds
    const timeParts = timeString.split(':');
    if (timeParts.length > 2) {
      // We have seconds, only keep hours and minutes
      timeString = `${timeParts[0]}:${timeParts[1]}`;
    }
    
    // Convert "HH:MM" to "HHhMM"
    return timeString.replace(':', 'h');
  };

  const generateExcel = (weeks: any[]) => {
    const duplicateStart = new Date(trameData.StartDate);
    console.log("weeks :",weeks);
    // Create a new ExcelJS workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Trames App';
    workbook.lastModifiedBy = 'Trames App';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    console.log("uesdata : ", ues);
    // Create a sheet for each UE
    const ueSheets: { [key: string]: any } = {};

    // Create weekRoomTypes map to store room types per week per course
    const weekRoomTypes: { [key: string]: any } = {};

    weeks.forEach((week, weekIndex) => {
      week.forEach((day, dayIndex) => {
        day.forEach((course: any) => {
          if (!ueSheets[course.UEName]) {
            ueSheets[course.UEName] = {
              CM: {},
              TD: {},
              TP: {}
            };
          }
          const formattedStartHour = formatTimeToFrench(course.StartHour);
          const formattedEndHour = formatTimeToFrench(course.EndHour);
          const timeSlot = `${formattedStartHour}-${formattedEndHour}`;
          const groups = course.Groups.map((group: any) => group.Name).join(', ');
          
          // Create a unique key for this course occurrence
          const courseKey = `${course.UEName}|${course.Type}|${timeSlot}|${dayIndex}|${groups}`;
          
          if (!weekRoomTypes[courseKey]) {
            weekRoomTypes[courseKey] = Array(weeks.length).fill('X');
          }
          
          // Store the room type for this specific week
          weekRoomTypes[courseKey][weekIndex] = course.RoomType || 'X';
          
          if (!ueSheets[course.UEName][course.Type][timeSlot]) {
            ueSheets[course.UEName][course.Type][timeSlot] = {};
          }
          if (!ueSheets[course.UEName][course.Type][timeSlot][dayIndex]) {
            ueSheets[course.UEName][course.Type][timeSlot][dayIndex] = [];
          }
          const existingEntry = ueSheets[course.UEName][course.Type][timeSlot][dayIndex].find((entry: any) => entry.groups === groups);
          if (existingEntry) {
            existingEntry.weeks[weekIndex] = true;
          } else {
            ueSheets[course.UEName][course.Type][timeSlot][dayIndex].push({
              prof: course.ProfFullName || 'ZZ',
              groups: groups,
              courseKey: courseKey,  // Store the courseKey for lookup
              weeks: Array(weeks.length).fill(false)
            });
            ueSheets[course.UEName][course.Type][timeSlot][dayIndex].forEach((info: any) => {
              info.weeks[weekIndex] = true;
            });
          }
        });
      });
    });

    const daysInFrench = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    Object.keys(ueSheets).forEach(ueName => {
      const ue = Object.values(ues).flat().find((ue: UE) => ue.Name === ueName);
      
      // Create a new worksheet for each UE
      const worksheet = workbook.addWorksheet(ueName);
      
      // Define some styles
      const headerStyle = {
        font: { bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
      
      const borderStyle = {
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
      
      const boldStyle = { font: { bold: true } };
      const boldRedStyle = { font: { bold: true, color: { argb: 'FFFF0000' } } };
      const boldWhiteStyle = { font: { bold: true, color: { argb: 'FFFFFF' } } };
      
      const worksheetData = [
        ["Mention", layers.find(layer => layer.Id === currentLayerId)?.Name,"","","","","","","","","TABLEAU A NE PAS MODIFIER"],
        ["Parcours", trameData.Name || "","","","","","","","","","","","","","","CM","TD","TP","TERRAIN","COMMENTAIRES"],
        ["Code UE", ueName,"","","","","","","","","CHARGES issues d'APOGEE :", "", "", "", "", ue?.TotalHourVolume_CM || 0, ue?.TotalHourVolume_TD || 0, ue?.TotalHourVolume_TP || 0, 0],
        ["","","","","","","","","","","Nombre de groupes à planifier :"],
        ["","","","","","","","","","","Multiples de 1h30 : "],
        ["","","","","","","","","","","Multiples de 3h :"],
        ["","","","","","","","","","","Rappel Effectif : "],
        [],
        ["UE mutualisée :","NON","Si OUI indiquer les parcours :","","A renseigner dans cette case"],
        ["Responsable", ue?.ResponsibleName || ""],
        [],
        ["Intervenants :","Initales ","Nom Prénom","","Statut (à choisir dans menu déroulant)","","","","Indiquer les créneaux par X si une salle est à réserver par planning + initiales enseignant.e.s si différent à chaque séance"],
        ["","","","","","","","","Indiquer les créneaux par un A si salle hors FDS, préciser la salle à indiquer en \"notes\" + initiales enseignant.e.s si différent à chaque séance"],
        ["","","","","","","","","Indiquer les créneaux par un I si salle informatisée + initiales enseignant.e.s si différent à chaque séance"],
        [],
        [],
        [],
        [],
        [],
        [],
        ["CM","","","","","","",...weeks.map((_, index) => {
          const weekStartDate = new Date(duplicateStart);
          weekStartDate.setDate(weekStartDate.getDate() + (index * 7));
          // Format as S36\n04/09
          const weekNum = 36 + index;
          const day = String(weekStartDate.getDate()).padStart(2, '0');
          const month = String(weekStartDate.getMonth() + 1).padStart(2, '0');
          return `S${weekNum}\n${day}/${month}`;
        })],
        ["Jour", "Créneau", "Créneau non classique", "Enseignant", "Groupe/série", "Effectif", "Salle"]
      ];
      
      // Add rows to worksheet
      worksheetData.forEach(row => {
        worksheet.addRow(row);
      });

      // CM section
      Object.keys(ueSheets[ueName].CM).forEach(timeSlot => {
        Object.keys(ueSheets[ueName].CM[timeSlot]).forEach(dayIndex => {
          ueSheets[ueName].CM[timeSlot][dayIndex].forEach((info: any) => {
            const rowData = [
              daysInFrench[dayIndex],
              timeSlot,
              '',
              info.prof,
              info.groups,
              '',
              '',
              ...info.weeks.map((week: boolean, weekIdx: number) => {
                // If this week has the course, return the specific room type for this week
                if (week) {
                  return weekRoomTypes[info.courseKey][weekIdx];
                }
                return ''; // No course this week
              })
            ];
            worksheet.addRow(rowData);
          });
        });
      });

      // Add spacing row
      worksheet.addRow([]);
      
      // TD Section header - Add the row and store its index
      const tdHeaderRowIndex = worksheet.rowCount + 1;
      const tdHeaderRow = worksheet.addRow(["TD","","","","","","",...weeks.map((_, index) => {
        const weekStartDate = new Date(duplicateStart);
        weekStartDate.setDate(weekStartDate.getDate() + (index * 7));
        // Format as S36\n04/09
        const weekNum = 36 + index;
        const day = String(weekStartDate.getDate()).padStart(2, '0');
        const month = String(weekStartDate.getMonth() + 1).padStart(2, '0');
        return `S${weekNum}\n${day}/${month}`;
      })]);
      
      // TD Column headers
      worksheet.addRow(["Jour", "Créneau", "Créneau non classique", "Enseignant", "Groupe/série", "Effectif", "Salle"]);

      // TD data
      Object.keys(ueSheets[ueName].TD).forEach(timeSlot => {
        Object.keys(ueSheets[ueName].TD[timeSlot]).forEach(dayIndex => {
          ueSheets[ueName].TD[timeSlot][dayIndex].forEach((info: any) => {
            const rowData = [
              daysInFrench[dayIndex],
              timeSlot,
              '',
              info.prof,
              info.groups,
              '',
              '',
              ...info.weeks.map((week: boolean, weekIdx: number) => {
                if (week) {
                  return weekRoomTypes[info.courseKey][weekIdx];
                }
                return '';
              })
            ];
            worksheet.addRow(rowData);
          });
        });
      });

      // Add spacing row
      worksheet.addRow([]);
      
      // TP Section header - Add the row and store its index
      const tpHeaderRowIndex = worksheet.rowCount + 1;
      const tpHeaderRow = worksheet.addRow(["TP","","","","","","",...weeks.map((_, index) => {
        const weekStartDate = new Date(duplicateStart);
        weekStartDate.setDate(weekStartDate.getDate() + (index * 7));
        // Format as S36\n04/09
        const weekNum = 36 + index;
        const day = String(weekStartDate.getDate()).padStart(2, '0');
        const month = String(weekStartDate.getMonth() + 1).padStart(2, '0');
        return `S${weekNum}\n${day}/${month}`;
      })]);
      
      // TP Column headers
      worksheet.addRow(["Jour", "Créneau", "Créneau non classique", "Enseignant", "Groupe/série", "Effectif", "Salle"]);

      // TP data
      Object.keys(ueSheets[ueName].TP).forEach(timeSlot => {
        Object.keys(ueSheets[ueName].TP[timeSlot]).forEach(dayIndex => {
          ueSheets[ueName].TP[timeSlot][dayIndex].forEach((info: any) => {
            const rowData = [
              daysInFrench[dayIndex],
              timeSlot,
              '',
              info.prof,
              info.groups,
              '',
              '',
              ...info.weeks.map((week: boolean, weekIdx: number) => {
                if (week) {
                  return weekRoomTypes[info.courseKey][weekIdx];
                }
                return '';
              })
            ];
            worksheet.addRow(rowData);
          });
        });
      });

      // Apply cell merges after all data has been added
      // Header section merges
      worksheet.mergeCells('B1:J1');   // Mention row
      worksheet.mergeCells('K1:X1');   // Volume horaire total
      worksheet.mergeCells('B2:J2');   // Parcours row
      worksheet.mergeCells('K2:O2');   // Empty space
      worksheet.mergeCells('T2:X2');   // Commentaires
      worksheet.mergeCells('B3:J3');   // Code UE row
      worksheet.mergeCells('K3:O3');   // CHARGES issues d'APOGEE
      worksheet.mergeCells('T3:X3');   // Commentaires
      
      // Row 4-7 merges
      worksheet.mergeCells('K4:O4');   // Nombre de groupes
      worksheet.mergeCells('T4:X4');   // Commentaires
      worksheet.mergeCells('K5:O5');   // Multiples de 1h30
      worksheet.mergeCells('T5:X5');   // Commentaires
      worksheet.mergeCells('K6:O6');   // Multiples de 3h
      worksheet.mergeCells('T6:X6');   // Commentaires
      worksheet.mergeCells('K7:O7');   // Rappel Effectif
      worksheet.mergeCells('P7:X7');   // Effectif values
      
      // UE mutualisée row
      worksheet.mergeCells('C9:D9');   // NON
      worksheet.mergeCells('E9:W9');   // Si OUI indiquer
      
      // Responsable row
      worksheet.mergeCells('B10:W10'); // Responsable value
      
      // Intervenant rows
      worksheet.mergeCells('C12:D12'); // Initiales column
      worksheet.mergeCells('E12:H12'); // Nom Prénom column
      worksheet.mergeCells('I12:X12'); // Indiquer les créneaux text
      
      worksheet.mergeCells('C13:D13'); // Blank row
      worksheet.mergeCells('E13:H13');
      worksheet.mergeCells('I13:X13'); // Indiquer les créneaux A
      
      worksheet.mergeCells('C14:D14'); // Blank row
      worksheet.mergeCells('E14:H14');
      worksheet.mergeCells('I14:X14'); // Indiquer les créneaux I
      
      worksheet.mergeCells('C15:D15'); // Blank row
      worksheet.mergeCells('E15:H15');
      
      worksheet.mergeCells('C16:D16'); // Blank row
      worksheet.mergeCells('E16:H16');
      
      worksheet.mergeCells('C17:D17'); // Blank row
      worksheet.mergeCells('E17:H17');
      
      worksheet.mergeCells('C18:D18'); // Blank row
      worksheet.mergeCells('E18:H18');
      
      // CM/TD/TP section headers - Now we know the exact rows
      worksheet.mergeCells('A21:G21'); // CM header row
      worksheet.mergeCells(`A${tdHeaderRowIndex}:G${tdHeaderRowIndex}`); // TD header row
      worksheet.mergeCells(`A${tpHeaderRowIndex}:G${tpHeaderRowIndex}`); // TP header row
      
      // Apply borders to merged cells in header
      for (let row = 1; row <= 7; row++) {
        for (let col = 11; col <= 24; col++) {
          const cell = worksheet.getCell(row, col);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      }

      // Format column widths for better readability
      worksheet.columns.forEach((column, index) => {
        let maxLength = 0;
        worksheet.eachRow({ includeEmpty: true }, (row) => {
          const cell = row.getCell(index + 1);
          if (cell && cell.value) {
            const cellLength = cell.value.toString().length;
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          }
        });
        column.width = Math.min(maxLength, 15);
      });

      // Apply bold style to specified cells at the end
      worksheet.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell((cell) => {
          if (typeof cell.value === 'string' && [
            "Mention", "Parcours", "Code UE", "UE mutualisée :", "Responsable", "Intervenants :", 
            "Si OUI indiquer les parcours :", "Initales ", "Nom Prénom", "Statut (à choisir dans menu déroulant)", 
            "CHARGES issues d'APOGEE :", "Nombre de groupes à planifier :", "Rappel Effectif :", 
            "CM", "TD", "TP", "TERRAIN", "COMMENTAIRES", "Jour", "Créneau", "Créneau non classique", 
            "Enseignant", "Groupe/série", "Effectif", "Salle"
          ].includes(cell.value)) {
            cell.font = boldStyle.font;
          }
        });
      });

      // Apply yellow background to week headers
      worksheet.getRow(21).eachCell((cell, colIndex) => {
        cell.font = boldStyle.font;
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC04' } // Yellow color
        };
        
        // Enable text wrapping for week headers (starting from column 8)
        if (colIndex >= 8) {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true
          };
        }
      });
      
      worksheet.getRow(tdHeaderRowIndex).eachCell((cell, colIndex) => {
        cell.font = boldStyle.font;
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC04' } // Yellow color
        };
        
        // Enable text wrapping for week headers (starting from column 8)
        if (colIndex >= 8) {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true
          };
        }
      });
      
      worksheet.getRow(tpHeaderRowIndex).eachCell((cell, colIndex) => {
        cell.font = boldStyle.font;
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC04' } // Yellow color
        };
        
        // Enable text wrapping for week headers (starting from column 8)
        if (colIndex >= 8) {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true
          };
        }
      });

      // Apply yellow background to headers "Jour", "Créneau", "Créneau non classique", "Enseignant", "Groupe/série", "Effectif", "Salle"
      const headerRowIndex = worksheet.getRow(22).number;
      worksheet.getRow(headerRowIndex).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC04' } // Yellow color
        };
      });

      // Apply yellow background to headers "Jour", "Créneau", "Créneau non classique", "Enseignant", "Groupe/série", "Effectif", "Salle"
      worksheet.getRow(tdHeaderRowIndex+1).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC04' } // Yellow color
        };
      });

      // Apply yellow background to headers "Jour", "Créneau", "Créneau non classique", "Enseignant", "Groupe/série", "Effectif", "Salle"
      worksheet.getRow(tpHeaderRowIndex+1).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC04' } // Yellow color
        };
      });

      // Apply green background legend ("Indiquer les créneaux par X etc...")
      for(let i=0;i<3;i++){
        worksheet.getCell(12+i, 9).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '98CC54' } // Green color
          };
      }

      // Apply red background tab ("TABLEAU A NE PAS MODIFIER")
      worksheet.getCell(1, 11).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0404' } // Yellow color
      };

      // Apply borders to a range of cells
      const applyBordersToRange = (startRow,startCol,endRow,endCol ) => {
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            worksheet.getCell(row, col).border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
        }
      };

      // Apply borders to CM table
      applyBordersToRange(21,1, tdHeaderRowIndex-2,weeks.length+7);
      applyBordersToRange(tdHeaderRowIndex,1, tpHeaderRowIndex-2,weeks.length+7);
      applyBordersToRange(tpHeaderRowIndex,1, worksheet.rowCount,weeks.length+7);
      applyBordersToRange(12,2,18,8);

      worksheet.getCell(1, 11).font = boldWhiteStyle.font;

      // Define which cells to exclude from center alignment - simplified to just row and col
      const excludeFromCenterAlign = [
        { row: 1, col: 1 }, // Mention
        { row: 1, col: 2 }, // Layer name
        { row: 2, col: 1 }, // Parcours
        { row: 2, col: 2 }, // Trame name
        { row: 3, col: 1 }, // Code UE
        { row: 3, col: 2 }, // UE name
        { row: 9, col: 1 }, // UE mutualisée
        { row: 9, col: 2 }, // NON
        { row: 9, col: 3 }, // Si OUI indiquer
        { row: 9, col: 5 }, // A renseigner
        { row: 10, col: 1 }, // Responsable
        { row: 10, col: 2 }, // Responsable name
        { row: 12, col: 1 }  // Intervenants
      ];

      // Center all cell content except the excluded ones
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          // Check if the current cell should be excluded from center alignment
          const shouldExclude = excludeFromCenterAlign.some(
            item => item.row === rowNumber && item.col === colNumber
          );
          
          // Skip cells in week header rows that already have alignment set
          const isWeekHeader = (rowNumber === 21 || rowNumber === tdHeaderRowIndex || 
                              rowNumber === tpHeaderRowIndex) && colNumber >= 8;
          
          if (!shouldExclude && !isWeekHeader) {
            // Apply center alignment for both horizontal and vertical
            cell.alignment = {
              horizontal: 'center',
              vertical: 'middle'
            };
          }
        });
      });

      // Fix alignment for merged cells that need to be left-aligned
      const leftAlignedMergedCells = [
        'B1',    // Layer name
        'B2',    // Trame name
        'B3',    // UE name
        'E9',    // "Si OUI indiquer les parcours"
        'E9:W9', // The merged range
        'B10',   // Responsable name
        'B10:W10' // The merged range
      ];

      leftAlignedMergedCells.forEach(cellRef => {
        const cell = worksheet.getCell(cellRef);
        if (cell) {
          cell.alignment = {
            horizontal: 'left',
            vertical: 'middle'
          };
        }
      });

      // Apply bold and red style to specific text portions
      const specificTextCells = [
        { row: 12, col: 9, text: "Indiquer les créneaux par X" },
        { row: 13, col: 9, text: "Indiquer les créneaux par un A" },
        { row: 14, col: 9, text: "Indiquer les créneaux par un I" },
        { row: 3, col: 11, text: "CHARGES issues d'APOGEE :" },
        { row: 4, col: 11, text: "Nombre de groupes à planifier :" },
        { row: 7, col: 11, text: "Rappel Effectif : " },
        { row: 1, col: 2, text: layers.find(layer => layer.Id === currentLayerId)?.Name},
        { row: 2, col: 2, text: trameData.Name },
        { row: 3, col: 2, text: ueName},
        { row: 10, col: 2, text: ue?.ResponsibleName },
        { row: 9, col: 2, text: "NON" },
        { row: 9, col: 5, text: "A renseigner dans cette case" }
      ];

      specificTextCells.forEach(({ row, col, text }) => {
        const cell = worksheet.getCell(row, col);
        const parts = cell.value.split(text);
        cell.value = {
          richText: [
            { text: parts[0] },
            { text: text, font: boldRedStyle.font },
            { text: parts[1] }
          ]
        };
      });

        

    });


    // Save the Excel file
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${trameData.Name}-${layers.find(layer => layer.Id === currentLayerId)?.Name}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
    
    setIsLoading(null);
  };

  return (
    <div className="w-screen h-screen bg-gray-200  pt-8"
      onMouseUp={() => { setCurrentCours(null) }}>

      <div className='flex justify-around items-start relative mt-16'>
        {defaultDate.getTime() === new Date('2001-01-01').getTime() ?
          <CalendarCoursSelection setCurrentCours={setCurrentCours} ecus={currentLayerId ? uesByLayer[currentLayerId] : [{ Name: "No currentLayerId" }]} /> :
          <CalendarPoolSelection setCurrentCours={setCurrentCours} layerId={currentLayerId || -1} refreshTrigger={poolRefreshCounter} />
        }
        <div className='flex flex-col'>
          <div className='flex justify-between items-end w-[80vw]'>
            <CalendarLayerSelection
              layers={layers}
              updateLayer={(layer) => updateLayerMutation.mutate(layer)}
              onClick={(id: number) => setCurrentLayerId(id)}
              currentLayerId={currentLayerId || -1}
            />

            <div className="flex gap-2">
              {/* Group filter dropdown */}
              {groups.length > 0 && (
                <select
                  className="px-3 py-1 border rounded-lg flex-grow bg-white mb-2 shadow-md"
                  onChange={(e) => setSelectedGroupId(e.target.value === "all" ? null : parseInt(e.target.value))}
                  value={selectedGroupId || "all"}
                >
                  <option value="all">Tous les groupes</option>
                  {groups.map(group => (
                    <option key={group.Id} value={group.Id}>
                      {group.Name}
                    </option>
                  ))}
                </select>
              )}

              {/* Course type filter dropdown */}
              <select
                className="px-3 py-1 border rounded-lg flex-grow bg-white mb-2 shadow-md"
                onChange={(e) => setSelectedCourseType(e.target.value === "all" ? null : e.target.value)}
                value={selectedCourseType || "all"}
              >
                <option value="all">Tous les types</option>
                <option value="CM">CM</option>
                <option value="TD">TD</option>
                <option value="TP">TP</option>
              </select>
            </div>
          </div>

          <CalendarFrame
            setPoolRefreshCounter={setPoolRefreshCounter}
            setCurrentCours={setCurrentCours}
            currentCours={currentCours}
            AddCours={AddCours}
            fetchedCourse={filteredCours}
            setCours={() => { }} // We don't need to set course externally anymore
            trameId={trameId}
            date={defaultDate}
            color={currentLayerId ? layers.find(layer => layer.Id === currentLayerId)?.Color || "#ffffff" : "#ffffff"}
            onDeleteCourse={handleDeleteCourse}
          />
        </div>
      </div>

      {/* Draggable course element */}
      {currentCours && (
        <div className="absolute z-[100] -translate-x-1/2 translate-y-1/2 text-black text-xl w-80"
          style={{ top: `${mousePosition.y}px`, left: `${mousePosition.x}px` }}>
          <EcuItem darken={false} type={currentCours.Type} ueID={currentCours.UEId}
            onHover={() => { }} onLeave={() => { }} onMouseDown={() => { }} />
        </div>
      )}

      {/* Conditional rendering for control buttons */}
      <div className="mt-4 flex flex-col items-center">
        {defaultDate.getTime() === new Date('2001-01-01').getTime() ? (
          <div>
            <button
              className="py-2 px-6 rounded-lg transition-colors duration-200 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
              onClick={() => duplicate()}>
              Appliquer la semaine type
            </button>
          </div>
        ) : (
          <div className="flex justify-around max-w-7xl self-center gap-4">
            {/* Navigation Section */}
            <div className="mb-2 flex flex-col items-center">
              <h3 className="font-bold mb-1 text-blue-800">Navigation</h3>
              <div className="flex gap-2">
                <button
                  className="py-2 px-4 rounded-lg transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white shadow"
                  onClick={() => previousWeek()}>
                  Semaine précédente
                </button>
                <button
                  className="py-2 px-4 rounded-lg transition-colors duration-200 bg-blue-600 hover:bg-blue-700 text-white shadow"
                  onClick={() => nextWeek()}>
                  Semaine suivante
                </button>
              </div>
            </div>
            {/* Raccourcis Section */}
            <div className="mb-2 flex flex-col items-center">
              <h3 className="font-bold mb-1 text-purple-800">Aller à</h3>
              <div className="flex flex-col gap-2">
                <div className='flex gap-2'>
                  <button
                    className="py-2 px-4 rounded-lg transition-colors duration-200 bg-purple-600 hover:bg-purple-700 text-white shadow"
                    onClick={goToFirstWeek}>
                    Première semaine
                  </button>
                  <button
                    className="py-2 px-4 rounded-lg transition-colors duration-200 bg-purple-600 hover:bg-purple-700 text-white shadow"
                    onClick={goToLastWeek}>
                    Dernière semaine
                  </button>
                </div>
                <div className='flex gap-2'>
                  <h1 className='font-bold mb-1 ml-4 text-purple-800'>Date spécifique : </h1>
                  <input
                    type="date"
                    className='rounded-lg border-2 border-purple-800 flex-grow text-center text-purple-800'
                    value={defaultDate.toISOString().split('T')[0]}
                    onChange={(e) => updateDate(new Date(e.target.value))}
                  />

                </div>
              </div>
            </div>
            {/* Mode Section */}
            <div className="mb-2 flex flex-col items-center">
              <h3 className="font-bold mb-1 text-red-800">Mode</h3>
              <button
                className="py-2 px-6 rounded-lg transition-colors duration-200 bg-red-500 hover:bg-red-600 text-white shadow-lg"
                onClick={() => resetToBaseline()}>
                Retour à la semaine type
              </button>
            </div>
            {/* Utilitaires Section */}
            <div className="mb-2 flex flex-col items-center">
              <h3 className="font-bold mb-1 text-green-800">Utilitaires</h3>
              <button
                className="py-2 px-6 rounded-lg transition-colors duration-200 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                onClick={handleExportWeeks}>
                Exporter la trame
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarPageWrapper;