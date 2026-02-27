import React, { useEffect, useState } from 'react';
import { tripService } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
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
    const [userRole, setUserRole] = useState(null);

    const { currentVertical } = useSettings();

    useEffect(() => {
        const userStr = localStorage.getItem('adminUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserRole(user.role);
            } catch (e) {
                console.error("Error parsing user info", e);
            }
        }
    }, []);

    const fetchTrips = async () => {
        try {
            const params = {
                vertical: currentVertical
            };
            if (statusFilter) {
                params.status = statusFilter;
            }

            const data = await tripService.getTrips(params);
            console.log('Fetched trips data:', data);
            setTrips(data);
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
    }, [statusFilter, refreshTrigger, currentVertical]);

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
        }
    };

    const handleDeleteTrip = async (tripId) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this trip? This action cannot be undone.')) {
            return;
        }

        try {
            await tripService.deleteTrip(tripId);
            await fetchTrips();
            if (onTripUpdated) onTripUpdated();
        } catch (err) {
            alert('Failed to delete trip: ' + err.message);
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
        <div className="shadow-lg rounded-2xl overflow-hidden border transition-colors duration-500" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}>
            {/* Header Section */}
            <div className="px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--theme-text-main)' }}>{title}</h3>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>From:</span>
                        <input
                            type="date"
                            className="text-[10px] font-bold uppercase tracking-widest rounded-lg border px-3 py-2 transition-all duration-300 focus:outline-none focus:ring-1"
                            style={{
                                backgroundColor: 'var(--theme-bg-sidebar)',
                                borderColor: 'rgba(255,255,255,0.1)',
                                color: '#ffffff',
                                colorScheme: 'dark'
                            }}
                            value={dateFilter.start}
                            onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>To:</span>
                        <input
                            type="date"
                            className="text-[10px] font-bold uppercase tracking-widest rounded-lg border px-3 py-2 transition-all duration-300 focus:outline-none focus:ring-1"
                            style={{
                                backgroundColor: 'var(--theme-bg-sidebar)',
                                borderColor: 'rgba(255,255,255,0.1)',
                                color: '#ffffff',
                                colorScheme: 'dark'
                            }}
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

            <ul className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {trips.length === 0 ? (
                    <li className="px-6 py-8 text-center" style={{ color: 'var(--theme-text-muted)' }}>No trips found</li>
                ) : (
                    trips.map((trip) => (
                        <li key={trip._id} className="px-6 py-5 hover:bg-opacity-50 transition-colors" style={{ backgroundColor: 'transparent' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-4">
                                            <p className="text-sm font-bold" style={{ color: 'var(--theme-primary)' }}>{trip.customerName}</p>
                                            {trip.customerPhone && (
                                                <div className="flex items-center text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                                                    <svg className="h-3 w-3 mr-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <span>{trip.customerPhone}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                                            <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 opacity-50" />
                                            <p className="font-medium">{new Date(trip.tripDateTime).toLocaleString()}</p>
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
                                    <div className="mt-2 flex items-center text-sm">
                                        <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 opacity-50" style={{ color: 'var(--theme-text-muted)' }} />
                                        <p className="truncate" style={{ color: 'var(--theme-text-muted)' }}>
                                            <span className="font-bold uppercase text-[10px] tracking-wider mr-1" style={{ color: 'var(--theme-text-main)' }}>From:</span> {trip.pickupLocation}
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
                                                className="mt-1 flex items-center text-xs pl-6 transition-opacity hover:opacity-70"
                                                style={{ color: 'var(--theme-primary)' }}
                                            >
                                                <MapPin className="h-3 w-3 mr-1" />
                                                View on Google Maps
                                            </a>
                                        )}
                                        <p className="truncate mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                                            <span className="font-bold uppercase text-[10px] tracking-wider mr-1" style={{ color: 'var(--theme-text-main)' }}>To:</span> {trip.dropLocation}
                                        </p>
                                    </div>
                                    <div className="mt-3 text-sm flex justify-between items-center">
                                        <div>
                                            <span className="text-xs uppercase font-bold tracking-tight mr-2" style={{ color: 'var(--theme-text-muted)' }}>Vehicle:</span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-opacity-10" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary)' }}>{trip.vehicleCategory || trip.vehiclePreference}</span>
                                            {trip.vehicleSubcategory && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-white/5" style={{ color: 'var(--theme-text-main)' }}>{trip.vehicleSubcategory}</span>}
                                        </div>
                                        {trip.status === 'COMPLETED' && (trip.totalKm || trip.totalHours) && (
                                            <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                                                <span className="font-bold" style={{ color: 'var(--theme-text-main)' }}>Billing:</span> {trip.totalKm} km • {trip.totalHours} hrs
                                                {(trip.tollParking > 0 || trip.permit > 0) && ` • Toll/Permit: ₹${(trip.tollParking || 0) + (trip.permit || 0)}`}
                                            </div>
                                        )}
                                    </div>
                                    {trip.assignedDriver && (
                                        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--theme-text-muted)' }}>Assigned Driver</div>
                                            <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                                                <div className="flex items-center">
                                                    <User className="h-3 w-3 mr-1 opacity-50" />
                                                    <span className="font-medium" style={{ color: 'var(--theme-text-main)' }}>{trip.assignedDriver.name}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <svg className="h-3 w-3 mr-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <span>{trip.assignedDriver.phone}</span>
                                                    <a
                                                        href={`https://wa.me/91${trip.assignedDriver.phone.replace(/\\D/g, '').slice(-10)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-2 text-green-500 hover:text-green-600 transition-colors"
                                                        title="Message Driver on WhatsApp"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.472-1.761-1.645-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                        </svg>
                                                    </a>
                                                </div>
                                                <div className="flex items-center">
                                                    <svg className="h-3 w-3 mr-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span className="font-medium" style={{ color: 'var(--theme-text-main)' }}>{trip.assignedDriver.vehicleNumber}</span>
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
                                    {userRole === 'SUPER_ADMIN' && (
                                        <button
                                            onClick={() => handleDeleteTrip(trip._id)}
                                            className="ml-2 font-medium text-red-900 hover:text-red-700 border border-red-900 rounded px-3 py-1 bg-red-50"
                                            title="Delete Trip (Super Admin Only)"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))
                )}
            </ul>
            {
                selectedTrip && (
                    <AssignmentModal
                        trip={selectedTrip}
                        onClose={() => setSelectedTrip(null)}
                        onAssignSuccess={() => {
                            fetchTrips();
                            setSelectedTrip(null);
                            if (onTripUpdated) onTripUpdated();
                        }}
                    />
                )
            }
            {
                activeCompletionTrip && (
                    <TripCompletionModal
                        trip={activeCompletionTrip}
                        onClose={() => setActiveCompletionTrip(null)}
                        onComplete={() => {
                            fetchTrips();
                            setActiveCompletionTrip(null);
                            if (onTripUpdated) onTripUpdated();
                        }}
                    />
                )
            }
            {
                editTrip && (
                    <EditTripModal
                        trip={editTrip}
                        onClose={() => setEditTrip(null)}
                        onTripUpdated={() => {
                            fetchTrips();
                            setEditTrip(null);
                            if (onTripUpdated) onTripUpdated();
                        }}
                    />
                )
            }
        </div >
    );
};

export default TripList;

