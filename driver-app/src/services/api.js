const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Helper to get auth headers
const getAuthHeaders = () => {
    const driverStr = localStorage.getItem('driver');
    if (driverStr) {
        try {
            const driver = JSON.parse(driverStr);
            if (driver.token) {
                return {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${driver.token}`
                };
            }
        } catch (e) {
            console.error('Error parsing driver token', e);
        }
    }
    return { 'Content-Type': 'application/json' };
};

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
        const response = await fetch(`${API_URL}/drivers/${driverId}/trips`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch trips');
        return response.json();
    },

    getTripHistory: async (driverId) => {
        const response = await fetch(`${API_URL}/drivers/${driverId}/history`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch history');
        return response.json();
    },

    acceptTrip: async (tripId) => {
        const response = await fetch(`${API_URL}/trips/${tripId}/accept`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to accept trip');
        return response.json();
    },

    startTrip: async (tripId, otp) => {
        const response = await fetch(`${API_URL}/trips/${tripId}/start`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ otp })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to start trip');
        }
        return response.json();
    },

    completeTrip: async (tripId, completionDetails) => {
        // completionDetails can be JSON object OR FormData
        const headers = getAuthHeaders();

        let body;
        if (completionDetails instanceof FormData) {
            // If FormData, remove Content-Type header to let browser set it with boundary
            delete headers['Content-Type'];
            body = completionDetails;
        } else {
            body = JSON.stringify(completionDetails);
        }

        const response = await fetch(`${API_URL}/trips/${tripId}/complete`, {
            method: 'PATCH',
            headers: headers,
            body: body
        });
        if (!response.ok) throw new Error('Failed to complete trip');
        return response.json();
    },

    cancelTrip: async (tripId) => {
        const response = await fetch(`${API_URL}/trips/${tripId}/cancel`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to cancel trip');
        return response.json();
    }
};
