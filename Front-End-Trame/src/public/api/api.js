// Update BASE_URL to use Vite's env variable.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

console.log('API base URL:', BASE_URL);
// In-memory token storage (safer than localStorage)
let accessToken = null;

// In-memory cache for data that rarely changes
const staticCache = {
  UEs: null,
  groups: null,
};

// Week-based cache for classes
const classesCache = {};

async function handleResponse(response) {
    console.log("API ADRESS USED :", BASE_URL)
    
    // For 404 errors, return a specific error object so they can be handled appropriately
    if (response.status === 404) {
        const error = new Error('Resource not found');
        error.status = 404;
        throw error;
    }
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({
            message: `HTTP error! status: ${response.status}`
        }));
        const error = new Error(errorData.message || 'API request failed');
        error.status = response.status;
        throw error;
    }
    
    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return null;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

async function request(endpoint, options = {}) {
    const headers = {};
    
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include'
    });

    if (response.status === 401 && !options._isRetry) {
        try {
            const { accessToken: newToken } = await api.refreshToken();
            accessToken = newToken;

            return request(endpoint, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${newToken}`
                },
                _isRetry: true
            });
        } catch (refreshError) {
            accessToken = null;
            window.dispatchEvent(new Event('unauthorized'));
            throw refreshError;
        }
    }

    return handleResponse(response);
}

export const api = {
    setAccessToken: (token) => {
        accessToken = token;
    },

    get: (endpoint) => request(endpoint, { method: 'GET' }),

    post: (endpoint, body) => request(endpoint, {
        method: 'POST',
        body: body instanceof FormData ? body : JSON.stringify(body)
    }),

    put: (endpoint, body) => request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body)
    }),

    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),

    refreshToken: async () => {
        try {
            const response = await fetch(`${BASE_URL}/auth/token`, {
                method: 'POST',
                credentials: 'include'
            });
            return handleResponse(response);
        } catch (error) {
            accessToken = null;
            throw new Error('Failed to refresh token');
        }
    },

    logout: async () => {
        try {
            await request('/auth/logout', { method: 'POST' });
            accessToken = null;
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    },

    // New cached API methods
    cache: {
        // UEs related methods
        async getUEs() {
            if (staticCache.UEs) return staticCache.UEs;
            
            const data = await request('/ues');
            staticCache.UEs = data;
            return data;
        },

        async getUEById(id) {
            // Try to get from cache first
            if (staticCache.UEs) {
                const ue = staticCache.UEs.find(ue => ue.id === id);
                if (ue) return ue;
            }
            
            // If not in cache or not found, fetch directly
            return request(`/ues/${id}`);
        },

        clearUEsCache() {
            staticCache.UEs = null;
        },
        
        // Groups related methods
        async getGroups() {
            if (staticCache.groups) return staticCache.groups;
            
            const data = await request('/groups');
            staticCache.groups = data;
            return data;
        },

        async getGroupById(id) {
            // Try to get from cache first
            if (staticCache.groups) {
                const group = staticCache.groups.find(group => group.id === id);
                if (group) return group;
            }
            
            // If not in cache or not found, fetch directly
            return request(`/groups/${id}`);
        },

        clearGroupsCache() {
            staticCache.groups = null;
        },

        // Classes with week-based caching
        async getClassesByWeek(weekId) {
            if (classesCache[weekId]) return classesCache[weekId];
            
            const data = await request(`/classes/week/${weekId}`);
            classesCache[weekId] = data;
            return data;
        },

        clearClassesCacheForWeek(weekId) {
            if (weekId) {
                delete classesCache[weekId];
            } else {
                // Clear all classes cache if no weekId provided
                Object.keys(classesCache).forEach(key => delete classesCache[key]);
            }
        },

        // Utility to clear all caches
        clearAllCache() {
            staticCache.UEs = null;
            staticCache.groups = null;
            Object.keys(classesCache).forEach(key => delete classesCache[key]);
        }
    }
};

// Add a caching layer to the API
api.cache = {
  _ueCache: new Map(),
  _groupCache: new Map(),
  _courseCache: new Map(),
  _profCache: new Map(),
  
  async getUEs() {
    return this._getCachedData('ues', this._ueCache);
  },
  
  async getUEById(id) {
    if (this._ueCache.has(id)) {
      return this._ueCache.get(id);
    }
    const ue = await api.get(`/ues/${id}`);
    this._ueCache.set(id, ue);
    return ue;
  },
  
  async getUEsByLayer(layerId) {
    const cacheKey = `layer_${layerId}`;
    if (this._ueCache.has(cacheKey)) {
      return this._ueCache.get(cacheKey);
    }
    const ues = await api.get(`/ues/layer/${layerId}`);
    this._ueCache.set(cacheKey, ues);
    return ues;
  },

  async getGroups() {
    return this._getCachedData('groups', this._groupCache);
  },
  
  async getGroupsByLayer(layerId, onlyDefault = false) {
    const cacheKey = `layer_${layerId}_${onlyDefault ? 'default' : 'all'}`;
    if (this._groupCache.has(cacheKey)) {
      return this._groupCache.get(cacheKey);
    }
    const url = `/groups/layer/${layerId}${onlyDefault ? '?onlyDefault=true' : ''}`;
    const groups = await api.get(url);
    this._groupCache.set(cacheKey, groups);
    return groups;
  },

  async getClassesForDate(trameId, layerId, date) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const cacheKey = `${trameId}_${layerId}_${dateStr}`;
    
    if (this._courseCache.has(cacheKey)) {
      return this._courseCache.get(cacheKey);
    }
    
    const courses = await api.get(`/cours/date/${trameId}/${layerId}/${dateStr}`);
    
    // Cache the courses
    this._courseCache.set(cacheKey, courses);
    
    // Also cache individual courses by ID
    courses.forEach(course => {
      this._courseCache.set(`id_${course.Id}`, course);
    });
    
    return courses;
  },
  
  async getProfById(id) {
    if (this._profCache.has(id)) {
      return this._profCache.get(id);
    }
    const prof = await api.get(`/profs/${id}`);
    this._profCache.set(id, prof);
    return prof;
  },
  
  // Helper method to get or fetch data
  async _getCachedData(endpoint, cache) {
    const cacheKey = `all_${endpoint}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    const data = await api.get(`/${endpoint}`);
    cache.set(cacheKey, data);
    return data;
  },
  
  // Clear specific cache
  clearCache(cacheName) {
    if (cacheName === 'ue') this._ueCache.clear();
    else if (cacheName === 'group') this._groupCache.clear();
    else if (cacheName === 'course') this._courseCache.clear();
    else if (cacheName === 'prof') this._profCache.clear();
  },
  
  // Clear all caches
  clearAllCache() {
    this._ueCache.clear();
    this._groupCache.clear();
    this._courseCache.clear();
    this._profCache.clear();
  },

  // Modify to handle course group caching properly
  async getGroupsByCourse(courseId) {
    const cacheKey = `course_groups_${courseId}`;
    if (this._groupCache.has(cacheKey)) {
      return this._groupCache.get(cacheKey);
    }
    
    try {
      const groups = await api.get(`/groups/cours/${courseId}`);
      this._groupCache.set(cacheKey, groups);
      return groups;
    } catch (error) {
      // For 404, cache an empty array to prevent future requests
      if (error.status === 404) {
        this._groupCache.set(cacheKey, []);
        return [];
      }
      throw error;
    }
  },
}
