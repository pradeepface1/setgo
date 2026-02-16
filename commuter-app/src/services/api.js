const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const authService = {
    login: async (username, password) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }
        return response.json();
    },

    register: async (username, password) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role: 'commuter' }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }
        return response.json();
    }
};

const getAuthHeaders = () => {
    const userStr = localStorage.getItem('commuterUser');
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
    createTrip: async (tripData) => {
        const response = await fetch(`${API_URL}/trips`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(tripData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || error.details || 'Failed to create trip');
        }
        return response.json();
    },

    getTrips: async () => {
        const response = await fetch(`${API_URL}/trips/my-trips`, { // Assuming my-trips endpoint exists using userId from token
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            // Fallback if my-trips doesn't exist, try /trips?userId=... but we need userId
            // For now, let's assume /trips with auth returns user's trips if updated backend
            // Actually backend /trips filters by userId if provided in query, but requires auth now.
            // We can get userId from localStorage
            const userStr = localStorage.getItem('commuterUser');
            let userId = '';
            if (userStr) userId = JSON.parse(userStr).user.id || JSON.parse(userStr).user._id;

            const fallbackResponse = await fetch(`${API_URL}/trips?userId=${userId}`, {
                headers: getAuthHeaders()
            });
            if (!fallbackResponse.ok) throw new Error('Failed to fetch trips');
            return fallbackResponse.json();
        }
        return response.json();
    },

    getActiveTrips: async () => {
        // Fetch only active trips: PENDING, ASSIGNED, IN_PROGRESS
        const response = await fetch(`${API_URL}/trips/my-trips?status=PENDING,ASSIGNED,IN_PROGRESS`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            // Fallback: fetch all trips and filter client-side
            const userStr = localStorage.getItem('commuterUser');
            let userId = '';
            if (userStr) {
                const userData = JSON.parse(userStr);
                userId = userData.user?.id || userData.user?._id || '';
            }

            const fallbackResponse = await fetch(`${API_URL}/trips?userId=${userId}`, {
                headers: getAuthHeaders()
            });
            if (!fallbackResponse.ok) throw new Error('Failed to fetch active trips');

            const allTrips = await fallbackResponse.json();
            // Filter for active statuses only
            return allTrips.filter(trip =>
                trip.status === 'PENDING' ||
                trip.status === 'ASSIGNED' ||
                trip.status === 'IN_PROGRESS'
            );
        }
        return response.json();
    }
};

export const sosService = {
    createSOS: async (sosData) => {
        // Placeholder for SOS functionality
        console.log('SOS Alert Triggered:', sosData);
        // In a real implementation, this would call a backend endpoint
        // const response = await fetch(`${API_URL}/sos`, ...);
        return { success: true, message: 'SOS sent' };
    }
};
