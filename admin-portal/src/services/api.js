// Force correct production URL for Staging if env missing
const API_URL = import.meta.env.VITE_API_URL || 'https://backend-191882634358.asia-south1.run.app/api';
console.log('SetGo Admin Portal Loaded (v2-Staging)');
console.log('API URL Configured:', API_URL);

// Helper to get auth headers
const getAuthHeaders = () => {
    const userStr = localStorage.getItem('adminUser');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.token) {
                return {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                };
            }
        } catch (e) {
            console.error('Error parsing user token', e);
        }
    }
    return { 'Content-Type': 'application/json' };
};

// Centralized response handler
const handleResponse = async (response) => {
    if (response.status === 401) {
        console.warn('Unauthorized access (401). Redirecting to login.');
        localStorage.removeItem('adminUser');
        window.location.href = '/login';
        throw new Error('Session expired or unauthorized. Please log in again.');
    }

    if (!response.ok) {
        let errorMessage = 'Request failed';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || response.statusText;
        } catch (e) {
            errorMessage = response.statusText || 'Unknown Connection Error';
        }
        throw new Error(errorMessage);
    }

    // Some endpoints might return 204 No Content
    if (response.status === 204) {
        return null;
    }

    try {
        return await response.json();
    } catch (e) {
        console.warn('Response was OK but could not parse JSON:', e);
        return {}; // Fallback
    }
};

export const tripService = {
    // Authentication
    login: async (username, password) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        // Custom handling for login to not redirect on 401 (invalid credentials)
        if (!response.ok) {
            let errorMessage = 'Login failed';
            try {
                const error = await response.json();
                errorMessage = error.error || error.message || 'Login failed';
            } catch (e) { /* ignore json parse error */ }
            throw new Error(errorMessage);
        }
        return response.json();
    },

    parseTrip: async (text) => {
        const response = await fetch(`${API_URL}/trips/parse`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ text }),
        });
        return handleResponse(response);
    },

    createTrip: async (tripData) => {
        console.log('API: Sending trip data:', tripData);
        const response = await fetch(`${API_URL}/trips`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(tripData),
        });
        const result = await handleResponse(response);
        console.log('API: Received response:', result);
        return result;
    },

    getTrips: async (status) => {
        const query = status ? `?status=${status}` : '';
        const response = await fetch(`${API_URL}/trips${query}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    getDrivers: async (status) => {
        const query = status ? `?status=${status}` : '';
        const response = await fetch(`${API_URL}/drivers${query}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    createDriver: async (driverData) => {
        const response = await fetch(`${API_URL}/drivers`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(driverData),
        });
        return handleResponse(response);
    },

    deleteDriver: async (driverId) => {
        const response = await fetch(`${API_URL}/drivers/${driverId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    createUser: async (userData) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData),
        });
        return handleResponse(response);
    },

    getUsers: async () => {
        const response = await fetch(`${API_URL}/auth/users`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    updateUser: async (userId, userData) => {
        const response = await fetch(`${API_URL}/auth/users/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData),
        });
        return handleResponse(response);
    },

    deleteUser: async (userId) => {
        const response = await fetch(`${API_URL}/auth/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    assignDriver: async (tripId, driverId) => {
        const response = await fetch(`${API_URL}/trips/${tripId}/assign`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ driverId }),
        });
        return handleResponse(response);
    },

    updateDriverStatus: async (driverId, status) => {
        const response = await fetch(`${API_URL}/drivers/${driverId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status }),
        });
        return handleResponse(response);
    },

    updateDriver: async (driverId, data) => {
        const response = await fetch(`${API_URL}/drivers/${driverId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    updateTrip: async (tripId, data) => {
        const response = await fetch(`${API_URL}/trips/${tripId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    completeTrip: async (tripId, payload) => {
        const response = await fetch(`${API_URL}/trips/${tripId}/complete`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload || {}),
        });
        return handleResponse(response);
    },

    cancelTrip: async (tripId) => {
        const response = await fetch(`${API_URL}/trips/${tripId}/cancel`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getTripStats: async () => {
        const response = await fetch(`${API_URL}/trips/stats`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    getReports: async () => {
        const response = await fetch(`${API_URL}/trips/reports`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    }
};

export const organizationService = {
    getAll: async () => {
        const response = await fetch(`${API_URL}/organizations`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    getById: async (id) => {
        const response = await fetch(`${API_URL}/organizations/${id}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    create: async (data) => {
        const response = await fetch(`${API_URL}/organizations`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    update: async (id, data) => {
        const response = await fetch(`${API_URL}/organizations/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    delete: async (id) => {
        const response = await fetch(`${API_URL}/organizations/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    getStats: async (id) => {
        const response = await fetch(`${API_URL}/organizations/${id}/stats`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    }
};

export const sosService = {
    getStats: async () => {
        const response = await fetch(`${API_URL}/sos/stats`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },
    getAll: async () => {
        const response = await fetch(`${API_URL}/sos`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },
    resolve: async (id, adminId) => {
        const response = await fetch(`${API_URL}/sos/${id}/resolve`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ resolvedBy: adminId || 'admin' })
        });
        return handleResponse(response);
    }
};

export const aiService = {
    query: async (prompt, context) => {
        const response = await fetch(`${API_URL}/ai/query`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ prompt, context })
        });
        return handleResponse(response);
    }
};
