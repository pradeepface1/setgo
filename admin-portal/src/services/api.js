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

    getTrips: async (params) => {
        let query = '';
        if (params) {
            if (typeof params === 'string') {
                query = `?status=${params}`;
            } else if (typeof params === 'object') {
                const queryParams = new URLSearchParams();
                if (params.status) queryParams.append('status', params.status);
                if (params.vertical) queryParams.append('vertical', params.vertical);
                if (params.userId) queryParams.append('userId', params.userId);
                if (params.consignorId) queryParams.append('consignorId', params.consignorId);
                if (params.startDate) queryParams.append('startDate', params.startDate);
                if (params.endDate) queryParams.append('endDate', params.endDate);
                if (params.page) queryParams.append('page', params.page);
                if (params.limit) queryParams.append('limit', params.limit);
                query = `?${queryParams.toString()}`;
            }
        }
        const response = await fetch(`${API_URL}/trips${query}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    getDrivers: async (params) => {
        let query = '';
        if (typeof params === 'string') {
            query = params ? `?status=${params}` : '';
        } else if (typeof params === 'object') {
            const queryParams = new URLSearchParams();
            if (params.status) queryParams.append('status', params.status);
            if (params.vertical) queryParams.append('vertical', params.vertical);
            if (params.category) queryParams.append('category', params.category);
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.search) queryParams.append('search', params.search); // Future proofing
            query = `?${queryParams.toString()}`;
        }

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

    bulkCreateDriver: async (driversData) => {
        const response = await fetch(`${API_URL}/drivers/bulk`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ drivers: driversData }),
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

    deleteTrip: async (tripId) => {
        const response = await fetch(`${API_URL}/trips/${tripId}`, {
            method: 'DELETE',
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

    getMilestones: async (params) => {
        let query = '';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.vertical) queryParams.append('vertical', params.vertical);
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);
            if (params.organizationId) queryParams.append('organizationId', params.organizationId);
            if (params.consignorId) queryParams.append('consignorId', params.consignorId);
            if (params.driverId) queryParams.append('driverId', params.driverId);
            query = `?${queryParams.toString()}`;
        }
        const response = await fetch(`${API_URL}/trips/milestones${query}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    getMilestoneDetails: async (params) => {
        let query = '';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.vertical) queryParams.append('vertical', params.vertical);
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);
            if (params.organizationId) queryParams.append('organizationId', params.organizationId);
            if (params.consignorId) queryParams.append('consignorId', params.consignorId);
            if (params.driverId) queryParams.append('driverId', params.driverId);
            if (params.milestone) queryParams.append('milestone', params.milestone);
            query = `?${queryParams.toString()}`;
        }
        const response = await fetch(`${API_URL}/trips/milestones/details${query}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    getReports: async () => {
        const response = await fetch(`${API_URL}/trips/reports`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // Hand Loans
    createHandLoan: async (loanData) => {
        const response = await fetch(`${API_URL}/hand-loans`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(loanData),
        });
        return handleResponse(response);
    },

    getHandLoans: async (params) => {
        let query = '';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.driverId) queryParams.append('driverId', params.driverId);
            if (params.status) queryParams.append('status', params.status);
            query = `?${queryParams.toString()}`;
        }
        const response = await fetch(`${API_URL}/hand-loans${query}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    getHandLoanBalance: async (driverId) => {
        const response = await fetch(`${API_URL}/hand-loans/pending-balance/${driverId}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    recoverHandLoan: async (id, data) => {
        const response = await fetch(`${API_URL}/hand-loans/${id}/recover`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    }
};

export const organizationService = {
    getAll: async (vertical) => {
        const query = vertical ? `?vertical=${vertical}` : '';
        const response = await fetch(`${API_URL}/organizations${query}`, {
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

    updateMyPreferences: async (preferencesData) => {
        const response = await fetch(`${API_URL}/organizations/my-preferences`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ preferences: preferencesData })
        });
        return handleResponse(response);
    },

    getStats: async (id) => {
        const response = await fetch(`${API_URL}/organizations/${id}/stats`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    uploadLogo: async (id, file) => {
        const formData = new FormData();
        formData.append('logo', file);
        // Don't set Content-Type manually — browser sets it with correct boundary for multipart

        let token = null;
        const userStr = localStorage.getItem('adminUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                token = user.token;
            } catch (e) {
                console.error('Error parsing user token for upload', e);
            }
        }

        const response = await fetch(`${API_URL}/organizations/${id}/logo`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData
        });
        return handleResponse(response);
    }
};


export const consignorService = {
    getAll: async (params) => {
        let query = '';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.search) queryParams.append('search', params.search);
            query = `?${queryParams.toString()}`;
        }
        const response = await fetch(`${API_URL}/consignors${query}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },
    create: async (data) => {
        const response = await fetch(`${API_URL}/consignors`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    bulkCreate: async (dataArray) => {
        const response = await fetch(`${API_URL}/consignors/bulk`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ consignors: dataArray })
        });
        return handleResponse(response);
    },
    update: async (id, data) => {
        const response = await fetch(`${API_URL}/consignors/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    delete: async (id) => {
        const response = await fetch(`${API_URL}/consignors/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    }
};

export const reportsService = {
    getFinancials: async (params) => {
        const response = await fetch(`${API_URL}/reports/financials?${new URLSearchParams(params)}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },
    getAging: async (params) => {
        const response = await fetch(`${API_URL}/reports/aging?${new URLSearchParams(params)}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },
    getOperations: async (params) => {
        const response = await fetch(`${API_URL}/reports/operations?${new URLSearchParams(params)}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },
    getAnalytical: async (params) => {
        const response = await fetch(`${API_URL}/reports/analytical?${new URLSearchParams(params)}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },
    getHandLoans: async (params) => {
        const response = await fetch(`${API_URL}/reports/handloans?${new URLSearchParams(params)}`, {
            headers: getAuthHeaders()
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

export const rosterService = {
    getShifts: async () => {
        const response = await fetch(`${API_URL}/rosters/shifts`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },
    createShift: async (shiftData) => {
        const response = await fetch(`${API_URL}/rosters/shifts`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(shiftData)
        });
        return handleResponse(response);
    },
    deleteShift: async (id) => {
        const response = await fetch(`${API_URL}/rosters/shifts/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },
    getRosters: async (params) => {
        const queryParams = new URLSearchParams();
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.driverId) queryParams.append('driverId', params.driverId);

        const response = await fetch(`${API_URL}/rosters?${queryParams.toString()}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },
    createRoster: async (data) => {
        const response = await fetch(`${API_URL}/rosters`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    bulkCreateRosters: async (assignments) => {
        const response = await fetch(`${API_URL}/rosters/bulk`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ assignments })
        });
        return handleResponse(response);
    },
    updateRoster: async (id, data) => {
        const response = await fetch(`${API_URL}/rosters/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    }
};
