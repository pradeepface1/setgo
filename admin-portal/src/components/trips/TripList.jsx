import React, { useEffect, useState } from 'react';
import { tripService } from '../../services/api';
import { Clock, MapPin, User, Loader2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

import AssignmentModal from './AssignmentModal';
import TripCompletionModal from './TripCompletionModal';
import EditTripModal from './EditTripModal';

const TripList = ({ onTripUpdated, statusFilter, title = "Active Trips", refreshTrigger }) => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [activeCompletionTrip, setActiveCompletionTrip] = useState(null);
    const [editTrip, setEditTrip] = useState(null);
    const [cancellingTripId, setCancellingTripId] = useState(null);
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

    const fetchTrips = async () => {
        try {
            const data = await tripService.getTrips();
            console.log('Fetched trips data:', data);
            // Filter trips if statusFilter is provided
            let filteredTrips = data;
            if (statusFilter) {
                const statuses = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
                filteredTrips = data.filter(trip => statuses.includes(trip.status));
            }
            console.log('Filtered trips:', filteredTrips);
            setTrips(filteredTrips);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to load trips');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
        const interval = setInterval(fetchTrips, 30000);
        return () => clearInterval(interval);
    }, [statusFilter, refreshTrigger]);

    window.refreshTrips = fetchTrips;

    const handleCancelTrip = async (tripId) => {
        if (!window.confirm('Are you sure you want to cancel this trip?')) {
            return;
        }

        setCancellingTripId(tripId);
        try {
            await tripService.cancelTrip(tripId);
            await fetchTrips();
            if (onTripUpdated) onTripUpdated();
        } catch (err) {
            alert('Failed to cancel trip');
        } finally {
            setCancellingTripId(null);
        }
    };

    // ... (handleExportToExcel remains same) ...
    const handleExportToExcel = () => {
        let tripsToExport = trips;

        if (dateFilter.start) {
            const startDate = new Date(dateFilter.start);
            startDate.setHours(0, 0, 0, 0);
            tripsToExport = tripsToExport.filter(t => new Date(t.tripDateTime) >= startDate);
        }
        if (dateFilter.end) {
            const endDate = new Date(dateFilter.end);
            endDate.setHours(23, 59, 59, 999);
            tripsToExport = tripsToExport.filter(t => new Date(t.tripDateTime) <= endDate);
        }

        if (tripsToExport.length === 0) {
            alert('No trips found for the selected date range');
            return;
        }

        // Prepare data for export
        const exportData = tripsToExport.map(trip => ({
            'Trip ID': trip._id,
            'Customer Name': trip.customerName,
            'Phone': trip.customerPhone,
            'Pickup Location': trip.pickupLocation,
            'Drop Location': trip.dropLocation,
            'Trip Date': new Date(trip.tripDateTime).toLocaleDateString(),
            'Trip Time': new Date(trip.tripDateTime).toLocaleTimeString(),
            'Vehicle Category': trip.vehicleCategory || trip.vehiclePreference || 'N/A',
            'Vehicle Subcategory': trip.vehicleSubcategory || 'N/A',
            'Status': trip.status,
            'Driver Name': trip.assignedDriver ? trip.assignedDriver.name : 'Not Assigned',
            'Driver Mobile': trip.assignedDriver ? trip.assignedDriver.phone : 'N/A',
            'Car Number': trip.assignedDriver ? trip.assignedDriver.vehicleNumber : 'N/A',
            'Request Source': trip.requestSource || 'N/A',
            'Total KM': trip.totalKm || 0,
            'Total Hours': trip.totalHours || 0,
            'Toll/Parking': trip.tollParking || 0,
            'Permit': trip.permit || 0,
            'Extra KM': trip.extraKm || 0,
            'Extra Hours': trip.extraHours || 0,
            'Created At': new Date(trip.createdAt).toLocaleString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        // ... (column widths) ...
        const columnWidths = [
            { wch: 25 }, // Trip ID
            { wch: 20 }, // Customer Name
            { wch: 15 }, // Phone
            { wch: 30 }, // Pickup Location
            { wch: 30 }, // Drop Location
            { wch: 12 }, // Trip Date
            { wch: 12 }, // Trip Time
            { wch: 20 }, // Vehicle Category
            { wch: 20 }, // Vehicle Subcategory
            { wch: 12 }, // Status
            { wch: 20 }, // Driver Name
            { wch: 15 }, // Driver Mobile
            { wch: 15 }, // Car Number
            { wch: 15 }, // Request Source
            { wch: 20 }  // Created At
        ];
        worksheet['!cols'] = columnWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Trips');

        let filename = `Jubilant_Setgo_Trips`;
        if (dateFilter.start) filename += `_from_${dateFilter.start}`;
        if (dateFilter.end) filename += `_to_${dateFilter.end}`;
        filename += `_${new Date().toISOString().split('T')[0]}.xlsx`;

        XLSX.writeFile(workbook, filename);
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-jubilant-600" /></div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Header Section */}
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">From:</span>
                        <input
                            type="date"
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-jubilant-500 focus:ring-jubilant-500"
                            value={dateFilter.start}
                            onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">To:</span>
                        <input
                            type="date"
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-jubilant-500 focus:ring-jubilant-500"
                            value={dateFilter.end}
                            onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                    <button
                        onClick={handleExportToExcel}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            <ul className="divide-y divide-gray-800">
                {trips.length === 0 ? (
                    <li className="px-6 py-4 text-center text-gray-500">No trips found</li>
                ) : (
                    trips.map((trip) => (
                        <li key={trip._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-4">
                                            <p className="text-sm font-medium text-jubilant-600 truncate">{trip.customerName}</p>
                                            {trip.customerPhone && (
                                                <div className="flex items-center text-xs text-gray-600">
                                                    <svg className="h-3 w-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <span>{trip.customerPhone}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                            <p>{new Date(trip.tripDateTime).toLocaleString()}</p>
                                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trip.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                trip.status === 'ASSIGNED' ? 'bg-gray-100 text-gray-800' :
                                                    trip.status === 'STARTED' ? 'bg-orange-100 text-orange-800' :
                                                        trip.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                                                            trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                'bg-red-100 text-red-800'
                                                }`}>
                                                {trip.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500">
                                        <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                        <p className="truncate">
                                            <span className="font-medium text-gray-900">From:</span> {trip.pickupLocation}
                                            {trip.pickupType && trip.pickupType !== 'OTHERS' && (
                                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    {trip.pickupType.replace('_', ' ')}
                                                </span>
                                            )}
                                        </p>
                                        {(trip.pickupContext?.flightNumber || trip.pickupContext?.trainNumber || trip.pickupContext?.busNumber) && (
                                            <p className="mt-1 text-xs text-indigo-600 pl-6">
                                                {trip.pickupContext.flightNumber && `Flight: ${trip.pickupContext.flightNumber}`}
                                                {trip.pickupContext.trainNumber && `Train: ${trip.pickupContext.trainNumber}`}
                                                {trip.pickupContext.busNumber && `Bus: ${trip.pickupContext.busNumber}`}
                                            </p>
                                        )}
                                        {trip.googleLocation && (
                                            <a
                                                href={trip.googleLocation}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-1 flex items-center text-xs text-blue-600 hover:text-blue-800 pl-6"
                                            >
                                                <MapPin className="h-3 w-3 mr-1" />
                                                View on Google Maps
                                            </a>
                                        )}
                                        <p className="truncate mt-1">
                                            <span className="font-medium text-gray-900">To:</span> {trip.dropLocation}
                                        </p>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-500 flex justify-between">
                                        <div>
                                            Vehicle: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{trip.vehicleCategory || trip.vehiclePreference}</span>
                                            {trip.vehicleSubcategory && <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">{trip.vehicleSubcategory}</span>}
                                        </div>
                                        {trip.status === 'COMPLETED' && (trip.totalKm || trip.totalHours) && (
                                            <div className="mt-1 text-xs text-gray-500">
                                                <span className="font-medium text-gray-700">Billing:</span> {trip.totalKm} km • {trip.totalHours} hrs
                                                {(trip.tollParking > 0 || trip.permit > 0) && ` • Toll/Permit: ₹${(trip.tollParking || 0) + (trip.permit || 0)}`}
                                            </div>
                                        )}
                                    </div>
                                    {trip.assignedDriver && (
                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                            <div className="text-xs font-semibold text-gray-700 mb-1">Assigned Driver:</div>
                                            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                                <div className="flex items-center">
                                                    <User className="h-3 w-3 mr-1 text-gray-400" />
                                                    <span className="font-medium">{trip.assignedDriver.name}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <svg className="h-3 w-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <span>{trip.assignedDriver.phone}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <svg className="h-3 w-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span>{trip.assignedDriver.vehicleNumber}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="ml-4 flex-shrink-0 flex gap-2">
                                    {trip.status === 'PENDING' ? (
                                        <>
                                            <button
                                                onClick={() => setSelectedTrip(trip)}
                                                className="font-medium text-black hover:text-gray-700 border border-black rounded px-3 py-1"
                                            >
                                                Assign
                                            </button>
                                            <button
                                                onClick={() => handleCancelTrip(trip._id)}
                                                disabled={cancellingTripId === trip._id}
                                                className="font-medium text-red-600 hover:text-red-500 border border-red-600 rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {cancellingTripId === trip._id ? 'Cancelling...' : 'Cancel'}
                                            </button>
                                        </>
                                    ) : trip.status === 'ASSIGNED' ? (
                                        <>
                                            <button
                                                onClick={() => setActiveCompletionTrip(trip)}
                                                className="font-medium text-green-600 hover:text-green-500 border border-green-600 rounded px-3 py-1"
                                            >
                                                Complete
                                            </button>
                                            <button
                                                onClick={() => setEditTrip(trip)}
                                                className="font-medium text-blue-600 hover:text-blue-500 border border-blue-600 rounded px-3 py-1"
                                            >
                                                Edit
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="font-medium text-gray-400 border border-gray-300 rounded px-3 py-1 cursor-not-allowed"
                                                disabled
                                            >
                                                {trip.status}
                                            </button>
                                            <button
                                                onClick={() => setEditTrip(trip)}
                                                className="font-medium text-blue-600 hover:text-blue-500 border border-blue-600 rounded px-3 py-1"
                                            >
                                                Edit
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))
                )}
            </ul>
            {selectedTrip && (
                <AssignmentModal
                    trip={selectedTrip}
                    onClose={() => setSelectedTrip(null)}
                    onAssignSuccess={() => {
                        fetchTrips();
                        setSelectedTrip(null);
                        if (onTripUpdated) onTripUpdated();
                    }}
                />
            )}
            {activeCompletionTrip && (
                <TripCompletionModal
                    trip={activeCompletionTrip}
                    onClose={() => setActiveCompletionTrip(null)}
                    onComplete={() => {
                        fetchTrips();
                        setActiveCompletionTrip(null);
                        if (onTripUpdated) onTripUpdated();
                    }}
                />
            )}
            {editTrip && (
                <EditTripModal
                    trip={editTrip}
                    onClose={() => setEditTrip(null)}
                    onTripUpdated={() => {
                        fetchTrips();
                        setEditTrip(null);
                        if (onTripUpdated) onTripUpdated();
                    }}
                />
            )}
        </div>
    );
};

export default TripList;

