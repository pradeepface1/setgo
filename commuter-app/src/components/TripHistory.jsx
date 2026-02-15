
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/api'; // Import tripService
import { MessageSquare, Calendar, Clock } from 'lucide-react';

const TripHistory = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchTrips();
        }
    }, [user]);

    const fetchTrips = async () => {
        try {
            setLoading(true);
            const data = await tripService.getTrips();
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
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">
                                #
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">
                                Customer Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">
                                Date & Time
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">
                                From
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">
                                To
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">
                                Driver
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">
                                Vehicle
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">
                                Mobile
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-black">
                                status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {trips.map((trip, index) => (
                            <tr key={trip._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium border-b border-black">
                                    {index + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-black">
                                    {trip.customerName || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-black">
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                                        {trip.tripDateTime ? new Date(trip.tripDateTime).toLocaleDateString() : 'N/A'}
                                    </div>
                                    <div className="flex items-center mt-1 text-xs">
                                        <Clock className="h-3 w-3 mr-1.5 text-gray-400" />
                                        {trip.tripDateTime ? new Date(trip.tripDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 border-b border-black">
                                    <div className="flex items-center">
                                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                                        <span className="font-medium truncate">{trip.pickupLocation}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 border-b border-black">
                                    <div className="flex items-center">
                                        <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                                        <span className="font-medium truncate">{trip.dropLocation}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-black">
                                    {trip.assignedDriver ? (
                                        <div>
                                            <div className="font-medium text-gray-900">{trip.assignedDriver.name}</div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-black">
                                    {trip.assignedDriver ? (
                                        <div className="text-sm text-gray-900">{trip.assignedDriver.vehicleNumber}</div>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-black">
                                    {trip.assignedDriver ? (
                                        <div className="text-sm text-gray-900">{trip.assignedDriver.phone}</div>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap border-b border-black">
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
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TripHistory;
