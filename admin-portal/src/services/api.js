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

export const tripService = {
    // Authentication
    login: async (username, password) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }
        return response.json();
    },

    parseTrip: async (text) => {
        const response = await fetch(`${API_URL}/trips/parse`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ text }),
        });
        if (!response.ok) throw new Error('Parsing failed');
        return response.json();
    },

    createTrip: async (tripData) => {
        console.log('API: Sending trip data:', tripData);
        const response = await fetch(`${API_URL}/trips`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(tripData),
        });
        if (!response.ok) throw new Error('Creation failed');
        const result = await response.json();
        console.log('API: Received response:', result);
        return result;
    },

    getTrips: async (status) => {
        const query = status ? `?status=${status}` : '';
        const response = await fetch(`${API_URL}/trips${query}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Fetch failed');
        return response.json();
    },

    getDrivers: async (status) => {
        const query = status ? `?status=${status}` : '';
        const response = await fetch(`${API_URL}/drivers${query}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Fetch drivers failed');
        return response.json();
    },

    createDriver: async (driverData) => {
        const response = await fetch(`${API_URL}/drivers`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(driverData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create driver');
        }
        return response.json();
    },

    deleteDriver: async (driverId) => {
        const response = await fetch(`${API_URL}/drivers/${driverId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete driver');
        }
        return response.json();
    },

    createUser: async (userData) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create user');
        }
        return response.json();
    },

    getUsers: async () => {
        const response = await fetch(`${API_URL}/auth/users`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        return response.json();
    },

    updateUser: async (userId, userData) => {
        const response = await fetch(`${API_URL}/auth/users/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update user');
        }
        return response.json();
    },

    deleteUser: async (userId) => {
        const response = await fetch(`${API_URL}/auth/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete user');
        }
        return response.json();
    },

    assignDriver: async (tripId, driverId) => {
        const response = await fetch(`${API_URL}/trips/${tripId}/assign`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ driverId }),
        });
        if (!response.ok) throw new Error('Assignment failed');
        if (!response.ok) throw new Error('Assignment failed');
        return response.json();
    },

    updateDriverStatus: async (driverId, status) => {
        const response = await fetch(`${API_URL}/drivers/${driverId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Update failed');
        return response.json();
    },

    updateDriver: async (driverId, data) => {
        const response = await fetch(`${API_URL}/drivers/${driverId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Update failed');
        }
        return response.json();
    },

    completeTrip: async (tripId, payload) => {
        const response = await fetch(`${API_URL}/trips/${tripId}/complete`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload || {}),
        });
        if (!response.ok) throw new Error('Completion failed');
        return response.json();
    },

    cancelTrip: async (tripId) => {
        const response = await fetch(`${API_URL}/trips/${tripId}/cancel`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Cancellation failed');
        return response.json();
    },

    getTripStats: async () => {
        const response = await fetch(`${API_URL}/trips/stats`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Stats fetch failed');
        return response.json();
    },

    getReports: async () => {
        const response = await fetch(`${API_URL}/trips/reports`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Reports fetch failed');
        return response.json();
    }
};

export const organizationService = {
    getAll: async () => {
        const response = await fetch(`${API_URL}/organizations`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch organizations');
        return response.json();
    },

    getById: async (id) => {
        const response = await fetch(`${API_URL}/organizations/${id}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch organization');
        return response.json();
    },

    create: async (data) => {
        const response = await fetch(`${API_URL}/organizations`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create organization');
        }
        return response.json();
    },

    update: async (id, data) => {
        const response = await fetch(`${API_URL}/organizations/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update organization');
        }
        return response.json();
    },

    delete: async (id) => {
        const response = await fetch(`${API_URL}/organizations/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete organization');
        }
        return response.json();
    },

    getStats: async (id) => {
        const response = await fetch(`${API_URL}/organizations/${id}/stats`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch stats');
        return response.json();
    }
};

export const sosService = {
    getStats: async () => {
        const response = await fetch(`${API_URL}/sos/stats`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('SOS Stats fetch failed');
        return response.json();
    },
    getAll: async () => {
        const response = await fetch(`${API_URL}/sos`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('SOS fetch failed');
        return response.json();
    },
    resolve: async (id, adminId) => {
        const response = await fetch(`${API_URL}/sos/${id}/resolve`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ resolvedBy: adminId || 'admin' })
        });
        if (!response.ok) throw new Error('SOS resolve failed');
        return response.json();
    }
};

export const aiService = {
    query: async (prompt, context) => {
        const response = await fetch(`${API_URL}/ai/query`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ prompt, context })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'AI request failed');
        }
        return response.json();
    }
};
