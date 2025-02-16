// Update BASE_URL to use Vite's env variable.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api';

console.log('API base URL:', BASE_URL);
// In-memory token storage (safer than localStorage)
let accessToken = null;
async function handleResponse(response) {
    console.log("API ADRESS USED :", BASE_URL)
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({
            message: `HTTP error! status: ${response.status}`
        }));
        throw new Error(errorData.message || 'API request failed');
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
    }
};