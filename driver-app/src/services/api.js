const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const authService = {
    login: async (phone, password) => {
        const response = await fetch(`${API_URL}/auth/driver/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
        });
        if (!response.ok) throw new Error('Login failed');
        return response.json();
    }
};

export const tripService = {
    getAssignedTrips: async (driverId) => {
        const response = await fetch(`${API_URL}/drivers/${driverId}/trips`);
        if (!response.ok) throw new Error('Failed to fetch trips');
        return response.json();
    },

    getTripHistory: async (driverId) => {
        const response = await fetch(`${API_URL}/drivers/${driverId}/history`);
        if (!response.ok) throw new Error('Failed to fetch history');
        return response.json();
    },

    completeTrip: async (tripId, completionDetails = {}) => {
        const response = await fetch(`${API_URL}/trips/${tripId}/complete`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(completionDetails)
        });
        if (!response.ok) throw new Error('Failed to complete trip');
        return response.json();
    },

    cancelTrip: async (tripId) => {
        const response = await fetch(`${API_URL}/trips/${tripId}/cancel`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to cancel trip');
        return response.json();
    }
};
