import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../public/api/api';
import { useState, useEffect } from 'react';
// Get trame data with its layers
export function useTrame(trameId) {
  return useQuery({
    queryKey: ['trame', trameId],
    queryFn: () => api.get(`/trames/${trameId}`),
    enabled: !!trameId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Get layers for a trame
export function useLayers(trameId) {
  return useQuery({
    queryKey: ['layers', trameId],
    queryFn: () => api.get(`/layers/trame/${trameId}`),
    enabled: !!trameId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Add a mutation for updating layers
export function useUpdateLayer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updatedLayer) => {
      return api.put(`/layers/${updatedLayer.Id}`, updatedLayer);
    },
    onSuccess: (data, variables) => {
      // Invalidate the layers query to trigger a refetch
      queryClient.invalidateQueries({
        queryKey: ['layers'],
      });
      
      // Also update the layer in the cache directly for immediate UI update
      const trameId = variables.TrameId;
      if (trameId) {
        const previousLayers = queryClient.getQueryData(['layers', trameId]);
        if (previousLayers) {
          const updatedLayers = previousLayers.map(layer => 
            layer.Id === variables.Id ? { ...layer, ...variables } : layer
          );
          queryClient.setQueryData(['layers', trameId], updatedLayers);
        }
      }
    }
  });
}

// Get UEs for a layer
export function useUEsByLayer(layerId) {
  return useQuery({
    queryKey: ['ues', 'layer', layerId],
    queryFn: () => api.cache.getUEsByLayer(layerId),
    enabled: !!layerId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Get groups for a layer
export function useGroupsByLayer(layerId, onlyDefault = false) {
  return useQuery({
    queryKey: ['groups', 'layer', layerId, onlyDefault],
    queryFn: () => api.cache.getGroupsByLayer(layerId, onlyDefault),
    enabled: !!layerId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Get classes for a week
export function useClassesForWeek(monday, trameId, layerId) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['classes', 'week', trameId, layerId, monday ? monday.toISOString().split('T')[0] : null],
    queryFn: async () => {
      if (!monday || !trameId || !layerId) return [];
      
      const classPromises = [];
      for (let i = -1; i < 6; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        classPromises.push(api.cache.getClassesForDate(trameId, layerId, dateStr));
      }
      
      // Get all classes and enhance with UE and prof info
      const classes = (await Promise.all(classPromises)).flat();
      
      // Enhance classes with additional info
      return await Promise.all(classes.map(async (course) => {
        // Get UE info
        let ueData;
        try {
          ueData = await queryClient.fetchQuery({
            queryKey: ['ue', course.UEId],
            queryFn: () => api.cache.getUEById(course.UEId),
            staleTime: 1000 * 60 * 30, // 30 minutes
          });
        } catch (error) {
          ueData = { Name: 'Unknown UE' };
        }

        // Get professor info if available
        let profData = null;
        if (course.ProfId) {
          try {
            profData = await queryClient.fetchQuery({
              queryKey: ['prof', course.ProfId],
              queryFn: () => api.cache.getProfById(course.ProfId),
              staleTime: 1000 * 60 * 30, // 30 minutes
            });
          } catch (error) {
            profData = { FullName: 'Unknown Professor' };
          }
        }

        // Calculate end time
        const endTime = calculateEndTime(course.StartHour, course.length);
        
        return {
          ...course,
          UEName: ueData.Name,
          ProfFullName: profData ? profData.FullName : null,
          EndHour: endTime
        };
      }));
    },
    enabled: !!trameId && !!layerId && !!monday,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Add a "currently moving" tracking system - separate from deletion
const movingCourseIds = new Set();
const deletingCourseIds = new Set(); // Tracking deletion separately

// Enhanced course addition with optimistic updates
export function useAddCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ course, groups, separate, isMoving, originalId }) => {
      // If this is part of a move operation, track the original course ID
      if (isMoving && originalId) {
        movingCourseIds.add(originalId);
      }
      
      const response = await api.post('/cours', {
        course,
        groups,
        separate
      });
      
      // If this was a move operation, remove the ID from tracking
      if (isMoving && originalId) {
        setTimeout(() => {
          movingCourseIds.delete(originalId);
        }, 500); // Keep in tracking for a short time to prevent quick re-drags
      }
      
      return response;
    },
    // Add optimistic update
    onMutate: async ({ course, groups, separate, trameId, layerId }) => {
      console.log("Starting optimistic update for add:", course);
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['classes'] });
      
      // Get the Monday of the current week
      const monday = getMonday(new Date(course.Date));
      const mondayStr = monday.toISOString().split('T')[0];
      
      // Use the proper query key
      const queryKey = ['classes', 'week', trameId, layerId, mondayStr];
      
      // Get current courses from cache
      const previousCourses = queryClient.getQueryData(queryKey) || [];
      
      // Create optimistic course placeholder
      const optimisticCourse = {
        ...course,
        Id: `temp-${Date.now()}`,
        Groups: groups || [],
        LayerId: layerId,
        TrameId: trameId,
        UEName: 'Loading...',
        ProfFullName: 'Loading...',
        EndHour: calculateEndTime(course.StartHour, course.length || 1),
        isOptimistic: true
      };
      
      // Update the cache with optimistic data
      queryClient.setQueryData(queryKey, [...previousCourses, optimisticCourse]);
      
      return { previousCourses, queryKey, optimisticCourse };
    },
    onSuccess: async (data, variables, context) => {
      console.log("onSuccess triggered with data:", data);
      if (!context) {
        console.error("Context is undefined in onSuccess");
        return;
      }
      
      const { queryKey, optimisticCourse } = context;
      const { trameId, layerId } = variables;

      try {
        // Prepare the updated course(s) with full data
        let newCourses = [];
        
        if (Array.isArray(data)) {
          // Handle multiple courses returned
          newCourses = await Promise.all(data.map(async (newCourse) => {
            try {
              const ueData = await api.cache.getUEById(newCourse.UEId);
              const profData = newCourse.ProfId ? await api.cache.getProfById(newCourse.ProfId) : null;
              const endTime = calculateEndTime(newCourse.StartHour, newCourse.length);
              
              return {
                ...newCourse,
                UEName: ueData?.Name || "Unknown",
                ProfFullName: profData?.FullName || null,
                EndHour: endTime,
                LayerId: layerId,
                TrameId: trameId
              };
            } catch (e) {
              console.error("Error enhancing course data:", e);
              return {
                ...newCourse,
                UEName: "Unknown",
                EndHour: calculateEndTime(newCourse.StartHour, newCourse.length),
                LayerId: layerId,
                TrameId: trameId
              };
            }
          }));
        } else if (data) {
          // Handle single course returned
          try {
            const ueData = await api.cache.getUEById(data.UEId);
            const profData = data.ProfId ? await api.cache.getProfById(data.ProfId) : null;
            const endTime = calculateEndTime(data.StartHour, data.length);
            
            newCourses = [{
              ...data,
              UEName: ueData?.Name || "Unknown",
              ProfFullName: profData?.FullName || null,
              EndHour: endTime,
              LayerId: layerId,
              TrameId: trameId
            }];
          } catch (e) {
            console.error("Error enhancing course data:", e);
            newCourses = [{
              ...data,
              UEName: "Unknown",
              EndHour: calculateEndTime(data.StartHour, data.length),
              LayerId: layerId,
              TrameId: trameId
            }];
          }
        }
        
        // Replace optimistic course with actual data
        const currentCourses = queryClient.getQueryData(queryKey) || [];
        const updatedCourses = currentCourses
          .filter(c => !c.isOptimistic)  // Remove optimistic placeholder
          .concat(newCourses);           // Add actual course(s)
        
        // Update the cache with the final data
        queryClient.setQueryData(queryKey, updatedCourses);
        console.log("Cache updated successfully with:", updatedCourses);
      } catch (error) {
        console.error("Error in onSuccess handler:", error);
        // If enhancement fails, at least keep the server response in the cache
        if (data) {
          // Get current courses minus the optimistic one
          const currentCourses = (queryClient.getQueryData(queryKey) || [])
            .filter(c => !c.isOptimistic);
          
          // Add the server response as-is
          if (Array.isArray(data)) {
            queryClient.setQueryData(queryKey, [...currentCourses, ...data]);
          } else {
            queryClient.setQueryData(queryKey, [...currentCourses, data]);
          }
        }
      }
    },
    onError: (error, variables, context) => {
      console.error('Failed to add course:', error);
      if (!context) {
        console.error("Context is undefined in onError");
        return;
      }
      
      // Revert to previous state if the mutation fails
      const { previousCourses, queryKey } = context;
      queryClient.setQueryData(queryKey, previousCourses);
    },
    // Critical fix: don't roll back the optimistic update automatically on settle
    onSettled: () => {
      // Don't do anything here to avoid undoing our cache updates
    }
  });
}

// Improved hook for course deletion with optimistic updates
export function useDeleteCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ courseId, trameId, layerId, date, isMoving = false, setPoolRefreshCounter }) => {
      // Convert ID to string for consistent comparison
      const strCourseId = String(courseId);
      
      // Check if this course is already being processed
      if (isMoving) {
        if (movingCourseIds.has(strCourseId)) {
          console.log('Course is already being moved, blocking deletion', courseId);
          throw new Error('COURSE_ALREADY_MOVING');
        }
        movingCourseIds.add(strCourseId);
      } else {
        if (deletingCourseIds.has(strCourseId)) {
          console.log('Course is already being deleted', courseId);
          return null; // Return early without error to prevent duplicate API calls
        }
        deletingCourseIds.add(strCourseId);
      }
      
      console.log(`Deleting course ${courseId}, isMoving=${isMoving}`);
      try {
        const result = await api.delete(`/cours/${courseId}`);
        console.log(`Server confirmed deletion of course ${courseId}`);
        return result;
      } finally {
        // Always clean up tracking sets regardless of success/failure
        if (isMoving) {
          setTimeout(() => {
            movingCourseIds.delete(strCourseId);
          }, 500);
        } else {
          deletingCourseIds.delete(strCourseId);
        }
      }
    },
    
    onMutate: async ({ courseId, trameId, layerId, date }) => {
      console.log("Starting optimistic delete for:", courseId);
      
      // Convert ID to string for consistent comparison
      const strCourseId = String(courseId);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['classes'] });
      
      // Determine the query key for the current week
      const mondayDate = getMonday(new Date(date));
      const mondayStr = mondayDate.toISOString().split('T')[0];
      const queryKey = ['classes', 'week', trameId, layerId, mondayStr];
      
      // Get current courses from cache
      const previousCourses = queryClient.getQueryData(queryKey) || [];
      
      // Debug cache contents
      console.log(`Searching for course ${strCourseId} in cache containing ${previousCourses.length} items`);
      if (previousCourses.length > 0) {
        console.log("Cache course IDs:", previousCourses.map(c => String(c.Id)).join(", "));
      }
      
      // IMPROVED: Try to find the course by string conversion of IDs
      const courseToDelete = previousCourses.find(c => String(c.Id) === strCourseId);
      
      // FIX: Even if course isn't found, still update UI
      const updatedCourses = previousCourses.filter(c => String(c.Id) !== strCourseId);
      
      // Update the cache with filtered data
      queryClient.setQueryData(queryKey, updatedCourses);
      
      // Also attempt to update any other week cache that might contain this course
      const allWeekQueries = queryClient.getQueryCache().findAll({
        predicate: query => query.queryKey[0] === 'classes' && query.queryKey[1] === 'week'
      });
      
      for (const query of allWeekQueries) {
        // Skip the current week's query as we already handled it
        if (query.queryKey.join() === queryKey.join()) continue;
        
        const weekData = queryClient.getQueryData(query.queryKey) || [];
        const containsCourse = weekData.some(c => String(c.Id) === strCourseId);
        
        if (containsCourse) {
          console.log(`Found course ${courseId} in another week cache, removing it`);
          const weekUpdated = weekData.filter(c => String(c.Id) !== strCourseId);
          queryClient.setQueryData(query.queryKey, weekUpdated);
        }
      }
      
      if (courseToDelete) {
        console.log(`Removed course ${courseId} from UI, remaining: ${updatedCourses.length}`);
      } else {
        console.log(`Force removed course ${courseId} from UI cache`);
      }
      
      return { 
        previousCourses, 
        queryKey, 
        courseId: strCourseId,
        courseFound: !!courseToDelete,
        courseToDelete
      };
    },
    
    onSuccess: (data, variables, context) => {
      if (!context) return;
      
      // Force immediate cleanup of tracking sets
      const strCourseId = String(variables.courseId);
      movingCourseIds.delete(strCourseId);
      deletingCourseIds.delete(strCourseId);
      
      console.log(`Delete confirmed for course ${variables.courseId}`);
      
      // Skip further cache verification if course wasn't found in cache originally
      if (context.courseFound === false) return;

      // Verify the cache was correctly updated
      const { queryKey } = context;
      const currentCourses = queryClient.getQueryData(queryKey) || [];
      const stillExists = currentCourses.some(c => String(c.Id) === strCourseId);
      
      if (stillExists) {
        console.warn(`Course ${variables.courseId} still exists in cache after deletion! Forcing removal...`);
        // Force manual cache update again
        const forcedUpdate = currentCourses.filter(c => String(c.Id) !== strCourseId);
        queryClient.setQueryData(queryKey, forcedUpdate);
      }
      
      // Always increment the pool refresh counter when provided
      // It's better to refresh too much than not enough
      if (variables.setPoolRefreshCounter) {
        console.log('Refreshing course pool after deletion');
        variables.setPoolRefreshCounter(prev => prev + 1);
      }
      
      if (!variables.isMoving) {
        // Force a selective cache update for this week's data
        queryClient.invalidateQueries({ queryKey: queryKey });
      }
    },
    
    onError: (error, variables, context) => {
      console.error('Failed to delete course:', error);
      
      if (!context) return;
      
      // Clean up tracking sets
      movingCourseIds.delete(String(variables.courseId));
      deletingCourseIds.delete(String(variables.courseId));
      
      // Only revert if we actually modified the cache
      if (context.courseFound) {
        // Revert to previous state if the mutation fails
        const { previousCourses, queryKey } = context;
        queryClient.setQueryData(queryKey, previousCourses);
      }
    },
    
    onSettled: (data, error, variables) => {
      // Final cleanup as a safety measure
      const strCourseId = String(variables.courseId);
      movingCourseIds.delete(strCourseId);
      deletingCourseIds.delete(strCourseId);
    }
  });
}

// Add a utility hook to check if a course is being moved (not deleted)
export function useIsCourseLocked(courseId) {
  const [isLocked, setIsLocked] = useState(false);
  
  useEffect(() => {
    // Convert to string to ensure consistent comparisons
    const strId = String(courseId);
    
    const checkLock = () => {
      // Only check movingCourseIds, not deletingCourseIds
      setIsLocked(Array.from(movingCourseIds).some(id => String(id) === strId));
    };
    
    // Check initially
    checkLock();
    
    // Set up a timer to periodically check
    const timer = setInterval(checkLock, 200);
    
    return () => {
      clearInterval(timer);
    };
  }, [courseId]);
  
  return isLocked;
}

// Helper function to find a course in any cached week
function findCourseInCache(queryClient, courseId) {
  // Check the individual course cache first
  const course = queryClient.getQueryData(['course', courseId]);
  if (course) return course;
  
  // Search through all cached weeks
  const queryCache = queryClient.getQueryCache();
  const queries = queryCache.findAll(['classes', 'week']);
  
  for (const query of queries) {
    const data = query.state.data || [];
    const found = data.find(c => c.Id === courseId);
    if (found) return found;
  }
  
  return null;
}

// Remove findCourseInAllCachedWeeks function and replace with this simpler utility
function logCacheState(queryClient) {
  const queryCache = queryClient.getQueryCache();
  const classesWeekQueries = queryCache.findAll({ queryKey: ['classes', 'week'] });
  
  console.log(`Found ${classesWeekQueries.length} cached week queries`);
  classesWeekQueries.forEach(query => {
    const data = query.state.data || [];
    console.log(`Cache for ${query.queryKey.join('/')}: ${data.length} courses`);
  });
}

// Helper function to calculate end time
function calculateEndTime(startHour, length) {
  const [hours, minutes] = startHour.split(':').map(Number);
  const endDate = new Date();
  endDate.setHours(hours);
  endDate.setMinutes(minutes + length * 60);
  endDate.setSeconds(0);
  return endDate.toTimeString().split(' ')[0];
}

// Helper function to get Monday of a week
export function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  if (day === 1) return d;
  const diff = (day + 6) % 7; 
  d.setDate(d.getDate() - diff);
  return d;
}

// New hook for separating courses with optimistic updates
export function useSeparateCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ courseId, trameId, layerId }) => {
      console.log(`Separating course with ID: ${courseId}`);
      return api.post(`/cours/separate/${courseId}`);
    },
    
    onMutate: async ({ courseId, trameId, layerId }) => {
      console.log("Starting optimistic update for separation:", courseId);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['classes'] });
      
      // Find the course to separate in all cached weeks
      const classQueries = queryClient.getQueryCache().findAll({
        predicate: query => query.queryKey[0] === 'classes' && query.queryKey[1] === 'week'
      });
      
      let courseToSeparate;
      let affectedQueryKey;
      let previousCourses;
      
      for (const query of classQueries) {
        const courses = queryClient.getQueryData(query.queryKey) || [];
        courseToSeparate = courses.find(c => String(c.Id) === String(courseId));
        
        if (courseToSeparate) {
          affectedQueryKey = query.queryKey;
          previousCourses = courses;
          break;
        }
      }
      
      if (!courseToSeparate) {
        console.error("Course to separate not found in cache:", courseId);
        return { success: false };
      }
      
      // Create optimistic separated courses
      // We only need to implement a placeholder since we don't know how many courses will be created
      const optimisticCourse = {
        ...courseToSeparate,
        isOptimistic: true,
        separationInProgress: true
      };
      
      // Update the cache with optimistic data (just the placeholder for visual feedback)
      const updatedCourses = previousCourses.map(course => 
        String(course.Id) === String(courseId) ? optimisticCourse : course
      );
      
      queryClient.setQueryData(affectedQueryKey, updatedCourses);
      
      return { 
        previousCourses, 
        affectedQueryKey, 
        courseToSeparate,
        success: true
      };
    },
    
    onSuccess: async (newCourses, variables, context) => {
      if (!context || !context.success) return;
      
      const { affectedQueryKey, previousCourses, courseToSeparate } = context;
      
      try {
        // Enhance the new courses with additional info like UE name and end time
        const enhancedNewCourses = await Promise.all(newCourses.map(async (course) => {
          try {
            const ueData = await api.cache.getUEById(course.UEId);
            const profData = course.ProfId ? await api.cache.getProfById(course.ProfId) : null;
            const endTime = calculateEndTime(course.StartHour, course.length);
            
            return {
              ...course,
              UEName: ueData?.Name || courseToSeparate.UEName || "Unknown",
              ProfFullName: profData?.FullName || courseToSeparate.ProfFullName || null,
              EndHour: endTime
            };
          } catch (e) {
            console.error("Error enhancing separated course:", e);
            return {
              ...course,
              UEName: courseToSeparate.UEName || "Unknown",
              EndHour: calculateEndTime(course.StartHour, course.length)
            };
          }
        }));
        
        // Replace the original course with the new separated courses
        const currentCourses = queryClient.getQueryData(affectedQueryKey) || [];
        const updatedCourses = [
          ...currentCourses.filter(c => String(c.Id) !== String(courseToSeparate.Id)),
          ...enhancedNewCourses
        ];
        
        queryClient.setQueryData(affectedQueryKey, updatedCourses);
        console.log("Cache updated with separated courses:", enhancedNewCourses.length);
      } catch (error) {
        console.error("Error handling separated courses:", error);
        // If enhancement fails, just use the raw server data
        const currentCourses = queryClient.getQueryData(affectedQueryKey) || [];
        const updatedCourses = [
          ...currentCourses.filter(c => String(c.Id) !== String(courseToSeparate.Id)),
          ...newCourses
        ];
        queryClient.setQueryData(affectedQueryKey, updatedCourses);
      }
    },
    
    onError: (error, variables, context) => {
      if (!context || !context.success) return;
      
      console.error('Failed to separate course:', error);
      
      // Revert to previous state if the mutation fails
      const { previousCourses, affectedQueryKey } = context;
      queryClient.setQueryData(affectedQueryKey, previousCourses);
    }
  });
}

// New hook for merging courses with optimistic updates
function useMergeCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ courseId, trameId, layerId }) => {
      console.log(`Merging courses with reference ID: ${courseId}`);
      return api.post(`/cours/merge/${courseId}`);
    },
    
    onMutate: async ({ courseId, trameId, layerId }) => {
      console.log("Starting optimistic update for merge:", courseId);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['classes'] });
      
      // Find the course to use as a reference and other related courses in all cached weeks
      const classQueries = queryClient.getQueryCache().findAll({
        predicate: query => query.queryKey[0] === 'classes' && query.queryKey[1] === 'week'
      });
      
      let referenceCourse;
      let affectedQueryKey;
      let previousCourses;
      let relatedCourses = [];
      
      for (const query of classQueries) {
        const courses = queryClient.getQueryData(query.queryKey) || [];
        referenceCourse = courses.find(c => String(c.Id) === String(courseId));
        
        if (referenceCourse) {
          affectedQueryKey = query.queryKey;
          previousCourses = courses;
          
          // Find all related courses (same UE, date, start time)
          relatedCourses = courses.filter(c => 
            c.UEId === referenceCourse.UEId &&
            c.Date === referenceCourse.Date &&
            c.StartHour === referenceCourse.StartHour &&
            String(c.Id) !== String(courseId)
          );
          
          break;
        }
      }
      
      if (!referenceCourse) {
        console.error("Reference course for merge not found in cache:", courseId);
        return { success: false };
      }
      
      // Create an optimistic merged course
      const optimisticMergedCourse = {
        ...referenceCourse,
        Id: `temp-merged-${Date.now()}`,
        isOptimistic: true,
        mergeInProgress: true
      };
      
      // Get IDs of all courses that will be merged (to remove them)
      const courseIdsToRemove = [
        String(courseId), 
        ...relatedCourses.map(c => String(c.Id))
      ];
      
      // Update the cache with optimistic data
      const updatedCourses = [
        ...previousCourses.filter(c => !courseIdsToRemove.includes(String(c.Id))),
        optimisticMergedCourse
      ];
      
      queryClient.setQueryData(affectedQueryKey, updatedCourses);
      
      return { 
        previousCourses, 
        affectedQueryKey, 
        referenceCourse,
        courseIdsToRemove,
        success: true
      };
    },
    
    onSuccess: async (mergedCourse, variables, context) => {
      if (!context || !context.success) return;
      
      const { affectedQueryKey, previousCourses, referenceCourse, courseIdsToRemove } = context;
      
      try {
        // Enhance the merged course with additional info
        let enhancedMergedCourse;
        try {
          const ueData = await api.cache.getUEById(mergedCourse.UEId);
          const profData = mergedCourse.ProfId ? await api.cache.getProfById(mergedCourse.ProfId) : null;
          const endTime = calculateEndTime(mergedCourse.StartHour, mergedCourse.length);
          
          enhancedMergedCourse = {
            ...mergedCourse,
            UEName: ueData?.Name || referenceCourse.UEName || "Unknown",
            ProfFullName: profData?.FullName || referenceCourse.ProfFullName || null,
            EndHour: endTime
          };
        } catch (e) {
          console.error("Error enhancing merged course:", e);
          enhancedMergedCourse = {
            ...mergedCourse,
            UEName: referenceCourse.UEName || "Unknown",
            EndHour: calculateEndTime(mergedCourse.StartHour, mergedCourse.length)
          };
        }
        
        // Replace the related courses with the single merged course
        const currentCourses = queryClient.getQueryData(affectedQueryKey) || [];
        const updatedCourses = [
          ...currentCourses.filter(c => !courseIdsToRemove.includes(String(c.Id)) && !c.isOptimistic),
          enhancedMergedCourse
        ];
        
        queryClient.setQueryData(affectedQueryKey, updatedCourses);
        console.log("Cache updated with merged course:", enhancedMergedCourse.Id);
      } catch (error) {
        console.error("Error handling merged course:", error);
        // If enhancement fails, just use the raw server data
        const currentCourses = queryClient.getQueryData(affectedQueryKey) || [];
        const updatedCourses = [
          ...currentCourses.filter(c => !courseIdsToRemove.includes(String(c.Id)) && !c.isOptimistic),
          mergedCourse
        ];
        queryClient.setQueryData(affectedQueryKey, updatedCourses);
      }
    },
    
    onError: (error, variables, context) => {
      if (!context || !context.success) return;
      
      console.error('Failed to merge courses:', error);
      
      // Revert to previous state if the mutation fails
      const { previousCourses, affectedQueryKey } = context;
      queryClient.setQueryData(affectedQueryKey, previousCourses);
    }
  });
}

// Ensure these exports are added at the end of the file
export {
  useMergeCourse,
  calculateEndTime
};