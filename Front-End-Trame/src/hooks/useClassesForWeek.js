import { useQuery } from '@tanstack/react-query';
import { api } from '../public/api/api';
import { getMonday } from './useCalendarData';

// Enhanced hook for fetching classes for a week with better caching
export function useClassesForWeek(monday, trammeId, layerId) {
  return useQuery({
    queryKey: ['classes', 'week', trammeId, layerId, monday ? monday.toISOString().split('T')[0] : null],
    queryFn: async () => {
      if (!monday || !trammeId || !layerId) return [];
      
      console.log(`Fetching classes for week: ${monday.toISOString().split('T')[0]}`);
      
      const classPromises = [];
      // Fetch 7 days of data (-1 for Sunday to 5 for Saturday)
      for (let i = -1; i < 6; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        classPromises.push(api.cache.getClassesForDate(trammeId, layerId, dateStr));
      }
      
      try {
        // Get all classes and enhance with UE and prof info
        const classes = (await Promise.all(classPromises)).flat();
        
        // Log the course IDs we received to help with debugging
        console.log(`Received ${classes.length} courses for week ${monday.toISOString().split('T')[0]}:`);
        if (classes.length > 0) {
          console.log("Course IDs:", classes.map(c => c.Id).join(", "));
        }
        
        // Attach a property to help identify these courses in the cache
        return classes.map(course => ({
          ...course,
          _weekCacheId: `${monday.toISOString().split('T')[0]}_${course.Id}`
        }));
      } catch (error) {
        console.error("Error fetching classes for week:", error);
        return [];
      }
    },
    enabled: !!trammeId && !!layerId && !!monday,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export default useClassesForWeek;
