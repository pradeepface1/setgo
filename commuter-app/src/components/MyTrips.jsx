import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/api';
import { RefreshCw, MapPin, Calendar, Clock, User, Car, Phone, AlertCircle } from 'lucide-react';

const MyTrips = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchActiveTrips();
            // Auto-refresh every 30 seconds
            const interval = setInterval(fetchActiveTrips, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchActiveTrips = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const data = await tripService.getActiveTrips();
            setTrips(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching active trips:', err);
            setError('Could not load active trips');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        fetchActiveTrips(true);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            'ASSIGNED': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Assigned' },
            'IN_PROGRESS': { bg: 'bg-green-100', text: 'text-green-800', label: 'Started' }
        };

        const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    if (loading && !refreshing) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jubilant-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-4 text-red-500 bg-red-50 rounded-lg">
                <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with Refresh Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">My Active Trips</h2>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Empty State */}
            {trips.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
                    <Car className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No active trips</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        You don't have any ongoing trips at the moment.
                    </p>
                </div>
            ) : (
                /* Trip Cards */
                <div className="space-y-3">
                    {trips.map((trip, index) => (
                        <div
                            key={trip._id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                        >
                            {/* Trip Header */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Trip #{index + 1}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {trip.customerName}
                                    </p>
                                </div>
                                {getStatusBadge(trip.status)}
                            </div>

                            {/* Locations */}
                            <div className="space-y-2 mb-3">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-xs text-gray-500">Pickup</p>
                                        <p className="text-sm font-medium text-gray-900">{trip.pickupLocation}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-xs text-gray-500">Drop</p>
                                        <p className="text-sm font-medium text-gray-900">{trip.dropLocation}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="flex items-center text-sm text-gray-600 mb-3">
                                <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                                {trip.tripDateTime ? new Date(trip.tripDateTime).toLocaleDateString() : 'N/A'}
                                <Clock className="h-4 w-4 ml-3 mr-1.5 text-gray-400" />
                                {trip.tripDateTime ? new Date(trip.tripDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>

                            {/* Vehicle Category */}
                            <div className="flex items-center text-sm text-gray-600 mb-3">
                                <Car className="h-4 w-4 mr-1.5 text-gray-400" />
                                {trip.vehicleCategory || trip.vehiclePreference || 'N/A'}
                            </div>

                            {/* Driver Details */}
                            {trip.assignedDriver ? (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs font-medium text-gray-700 mb-2">Assigned Driver</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <User className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                            <span className="font-medium">{trip.assignedDriver.name}</span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                            <span>{trip.assignedDriver.phone}</span>
                                        </div>
                                        <div className="col-span-2 flex items-center text-gray-600">
                                            <Car className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                            <span>{trip.assignedDriver.vehicleNumber}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 italic">Driver not assigned yet</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Auto-refresh indicator */}
            <p className="text-xs text-center text-gray-400 mt-4">
                Auto-refreshing every 30 seconds
            </p>
        </div>
    );
};

export default MyTrips;
