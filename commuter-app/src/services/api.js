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

export const tripService = {
    createTrip: async (tripData) => {
        const response = await fetch(`${API_URL}/trips`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tripData),
        });
        if (!response.ok) throw new Error('Failed to create trip');
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
