
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Calendar, Clock } from 'lucide-react';

const TripHistory = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        fetchTrips();
    }, [user]);

    const fetchTrips = async () => {
        try {
            // Fetch trips for the current user ID
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            const response = await fetch(`${API_URL}/trips?userId=${user.id || user._id}`);

            if (!response.ok) {
                throw new Error('Failed to fetch trips');
            }

            const data = await response.json();
            setTrips(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching trip history:', err);
            setError('Could not load trip history');
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jubilant-600"></div>
        </div>
    );

    if (error) return (
        <div className="text-center p-4 text-red-500 bg-red-50 rounded-lg">
            {error}
        </div>
    );

    if (trips.length === 0) return (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No trips yet</h3>
            <p className="mt-2 text-sm text-gray-500">Your requested trips will appear here.</p>
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date & Time
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Route
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Driver
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {trips.map((trip) => (
                            <tr key={trip._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                        trip.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                            trip.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {trip.status}
                                    </span>
                                    <div className="text-xs text-gray-400 mt-1">
                                        via {trip.requestSource}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                                        {trip.tripDateTime ? new Date(trip.tripDateTime).toLocaleDateString() : 'N/A'}
                                    </div>
                                    <div className="flex items-center mt-1 text-xs">
                                        <Clock className="h-3 w-3 mr-1.5 text-gray-400" />
                                        {trip.tripDateTime ? new Date(trip.tripDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    <div className="flex items-start max-w-xs">
                                        <div className="flex flex-col space-y-1">
                                            <div className="flex items-center">
                                                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                                                <span className="font-medium truncate">{trip.pickupLocation}</span>
                                            </div>
                                            <div className="pl-1 border-l border-gray-200 ml-1 h-3"></div>
                                            <div className="flex items-center">
                                                <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                                                <span className="font-medium truncate">{trip.dropLocation}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {trip.assignedDriver ? (
                                        <div>
                                            <div className="font-medium text-gray-900">{trip.assignedDriver.name}</div>
                                            <div className="text-xs text-gray-500">{trip.assignedDriver.vehicleNumber}</div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">Unassigned</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TripHistory;
