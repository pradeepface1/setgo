const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        if (!response.ok) throw new Error('Parsing failed');
        return response.json();
    },

    createTrip: async (tripData) => {
        console.log('API: Sending trip data:', tripData);
        const response = await fetch(`${API_URL}/trips`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tripData),
        });
        if (!response.ok) throw new Error('Creation failed');
        const result = await response.json();
        console.log('API: Received response:', result);
        return result;
    },

    getTrips: async (status) => {
        const query = status ? `?status=${status}` : '';
        const response = await fetch(`${API_URL}/trips${query}`);
        if (!response.ok) throw new Error('Fetch failed');
        return response.json();
    },

    getDrivers: async (status) => {
        const query = status ? `?status=${status}` : '';
        const response = await fetch(`${API_URL}/drivers${query}`);
        if (!response.ok) throw new Error('Fetch drivers failed');
        return response.json();
    },

    createDriver: async (driverData) => {
        const response = await fetch(`${API_URL}/drivers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(driverData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create driver');
        }
        return response.json();
    },

    createUser: async (userData) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create user');
        }
        return response.json();
    },

    getUsers: async () => {
        const response = await fetch(`${API_URL}/auth/users`);
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        return response.json();
    },

    updateUser: async (userId, userData) => {
        const response = await fetch(`${API_URL}/auth/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driverId }),
        });
        if (!response.ok) throw new Error('Assignment failed');
        if (!response.ok) throw new Error('Assignment failed');
        return response.json();
    },

    updateDriverStatus: async (driverId, status) => {
        const response = await fetch(`${API_URL}/drivers/${driverId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Update failed');
        return response.json();
    },

    completeTrip: async (tripId) => {
        const response = await fetch(`${API_URL}/trips/${tripId}/complete`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Completion failed');
        return response.json();
    },

    cancelTrip: async (tripId) => {
        const response = await fetch(`${API_URL}/trips/${tripId}/cancel`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Cancellation failed');
        return response.json();
    },

    getTripStats: async () => {
        const response = await fetch(`${API_URL}/trips/stats`);
        if (!response.ok) throw new Error('Stats fetch failed');
        return response.json();
    },

    getReports: async () => {
        const response = await fetch(`${API_URL}/trips/reports`);
        if (!response.ok) throw new Error('Reports fetch failed');
        return response.json();
    }
};

export const sosService = {
    getStats: async () => {
        const response = await fetch(`${API_URL}/sos/stats`);
        if (!response.ok) throw new Error('SOS Stats fetch failed');
        return response.json();
    },
    getAll: async () => {
        const response = await fetch(`${API_URL}/sos`);
        if (!response.ok) throw new Error('SOS fetch failed');
        return response.json();
    },
    resolve: async (id, adminId) => {
        const response = await fetch(`${API_URL}/sos/${id}/resolve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolvedBy: adminId || 'admin' })
        });
        if (!response.ok) throw new Error('SOS resolve failed');
        return response.json();
    }
};
