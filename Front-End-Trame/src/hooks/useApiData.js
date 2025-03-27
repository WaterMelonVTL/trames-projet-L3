import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../public/api/api';

// UE related hooks
export function useUEs() {
  return useQuery({
    queryKey: ['UEs'],
    queryFn: () => api.cache.getUEs(),
    staleTime: 1000 * 60 * 30, // 30 minutes - UE data rarely changes during a session
  });
}

export function useUE(id) {
  const { data: allUEs } = useUEs();
  
  return useQuery({
    queryKey: ['ue', id],
    queryFn: () => api.cache.getUEById(id),
    // If we already have all UEs, use that instead of making a new request
    initialData: allUEs ? allUEs.find(ue => ue.Id === id) : undefined,
    enabled: !!id, // Only run query if id is provided
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useUEsByLayer(layerId) {
  return useQuery({
    queryKey: ['ues', 'layer', layerId],
    queryFn: () => api.cache.getUEsByLayer(layerId),
    enabled: !!layerId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Group related hooks
export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => api.cache.getGroups(),
    staleTime: 1000 * 60 * 30,
  });
}

export function useGroup(id) {
  const { data: allGroups } = useGroups();
  
  return useQuery({
    queryKey: ['group', id],
    queryFn: () => api.cache.getGroupById(id),
    // If we already have all groups, use that instead of making a new request
    initialData: allGroups ? allGroups.find(group => group.Id === id) : undefined,
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
  });
}

export function useGroupsByLayer(layerId, onlyDefault = false) {
  return useQuery({
    queryKey: ['groups', 'layer', layerId, onlyDefault],
    queryFn: () => api.cache.getGroupsByLayer(layerId, onlyDefault),
    enabled: !!layerId,
    staleTime: 1000 * 60 * 30,
  });
}

// New hook to fetch multiple groups by their IDs
export function useGroupsByIds(groupIds) {
  // Convert to string for stable query key, and only run if we have IDs
  const groupIdsKey = groupIds ? JSON.stringify(groupIds) : null;
  const enabled = !!groupIds && Array.isArray(groupIds) && groupIds.length > 0;
  
  return useQuery({
    queryKey: ['groups', 'byIds', groupIdsKey],
    queryFn: async () => {
      if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
        return [];
      }
      
      // Fetch each group by ID using the existing cache function
      const promises = groupIds.map(id => 
        api.cache.getGroupById(id)
          .catch(() => {
            console.warn(`Failed to fetch group with ID: ${id}`);
            return null;
          })
      );
      
      const results = await Promise.all(promises);
      // Filter out nulls (failed requests)
      return results.filter(group => group !== null);
    },
    enabled: enabled,
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// Modified to handle 404 responses properly and prevent retries
export function useGroupsByCourse(courseId) {
  // Skip null/undefined/temp IDs to prevent unnecessary requests
  const enabled = !!courseId && typeof courseId === 'number' && !String(courseId).startsWith('temp');
  
  return useQuery({
    queryKey: ['groups', 'course', courseId],
    queryFn: async () => {
      try {
        const data = await api.get(`/groups/cours/${courseId}`);
        return data;
      } catch (error) {
        // If it's a 404, return an empty array but cache the response
        if (error.message && error.message.includes('404')) {
          return [];
        }
        throw error; // Re-throw other errors
      }
    },
    enabled: enabled,
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60, // Cache even 404 responses for 1 hour
    retry: (failureCount, error) => {
      // Don't retry for 404 responses
      if (error.message && error.message.includes('404')) {
        return false;
      }
      // Only retry other errors up to 2 times
      return failureCount < 2;
    }
  });
}

// Professor related hooks
export function useProf(id) {
  return useQuery({
    queryKey: ['prof', id],
    queryFn: () => api.cache.getProfById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
  });
}

// Classes related hooks - with week-based caching
export function useClassesByWeek(monday, trameId, layerId) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['classes', 'week', trameId, layerId, monday ? monday.toISOString().split('T')[0] : null],
    queryFn: async () => {
      // Keep existing implementation from useCalendarData.js
      // ...
    },
    enabled: !!trameId && !!layerId && !!monday,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to clear all cache data (e.g., after logout)
export function useClearCache() {
  const queryClient = useQueryClient();
  
  return () => {
    api.cache.clearAllCache();
    queryClient.clear(); // Clear React Query cache as well
  };
}

// Export the getMonday function too for consistent date handling
export function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  if (day === 1) return d;
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

// Utility function to calculate end time (shared across components)
export function calculateEndTime(startHour, length) {
  const [hours, minutes] = startHour.split(':').map(Number);
  const endDate = new Date();
  endDate.setHours(hours);
  endDate.setMinutes(minutes + length * 60);
  endDate.setSeconds(0);
  return endDate.toTimeString().split(' ')[0];
}
