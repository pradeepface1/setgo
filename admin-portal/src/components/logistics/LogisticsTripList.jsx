import React, { useState, useEffect } from 'react';
import LogisticsTripForm from './LogisticsTripForm';
import { useSettings } from '../../context/SettingsContext';
import { tripService, consignorService } from '../../services/api';
import { Filter, ChevronLeft, ChevronRight, RefreshCw, Calendar, Truck, Edit, Download, FileText } from 'lucide-react'; // Added Edit, Download, FileText
import { generateHireSlip } from '../../utils/generateHireSlip';
import { useAuth } from '../../context/AuthContext';

const LogisticsTripList = () => {
    const { preferences } = useAuth();
    const [trips, setTrips] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [totalPages, setTotalPages] = useState(1);

    const [showForm, setShowForm] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null); // Added selectedTrip
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedSlips, setSelectedSlips] = useState([]); // State for bulk PDF generation

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [consignorFilter, setConsignorFilter] = useState('');
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

    // Data for Filters
    const [consignors, setConsignors] = useState([]);

    const { currentVertical } = useSettings();

    useEffect(() => {
        if (currentVertical === 'LOGISTICS') {
            loadConsignors();
            fetchTrips();
        } else {
            setLoading(false);
        }
    }, [currentVertical, refreshTrigger, page, statusFilter, consignorFilter, dateFilter]); // Re-fetch on filter/page change

    const loadConsignors = async () => {
        try {
            const data = await consignorService.getAll();
            setConsignors(data || []);
        } catch (error) {
            console.error('Failed to load consignors', error);
        }
    };

    const fetchTrips = async () => {
        setLoading(true);
        try {
            const params = {
                vertical: 'LOGISTICS',
                page,
                limit,
                status: statusFilter || 'ASSIGNED,ACCEPTED,STARTED,COMPLETED,CANCELLED,LOADING,IN_TRANSIT,UNLOADED,PAYMENT_PENDING',
                consignorId: consignorFilter,
                startDate: dateFilter.start,
                endDate: dateFilter.end
            };

            const response = await tripService.getTrips(params);

            if (response.trips) {
                setTrips(response.trips);
                setTotal(response.total);
                setTotalPages(response.totalPages);
            } else {
                // Fallback for non-paginated API (if rollback happened)
                setTrips(response);
                setTotal(response.length);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error fetching trips:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTrip = async (tripData) => {
        try {
            // Map route.from/to to compatible fields
            const payload = {
                ...tripData,
                pickupLocation: tripData.route?.from,
                dropLocation: tripData.route?.to,
                loadingLocation: tripData.route?.from,
                unloadingLocation: tripData.route?.to
            };

            if (selectedTrip) {
                await tripService.updateTrip(selectedTrip._id, payload);
                alert('Trip updated successfully!');
            } else {
                await tripService.createTrip(payload);
                alert('Trip created successfully!');
            }

            setRefreshTrigger(prev => prev + 1);
            setShowForm(false);
            setSelectedTrip(null);
        } catch (error) {
            console.error("Failed to save trip:", error);
            alert(`Failed to save trip: ${error.message}`);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const clearFilters = () => {
        setStatusFilter('');
        setConsignorFilter('');
        setDateFilter({ start: '', end: '' });
        setPage(1);
    };

    if (currentVertical !== 'LOGISTICS') {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h2 className="text-xl font-semibold text-gray-700">Access Restricted</h2>
                <p className="text-gray-500 mt-2">Please switch to Logistics vertical to view this page.</p>
            </div>
        );
    }

    const toggleSlipSelection = (tripId) => {
        setSelectedSlips(prev =>
            prev.includes(tripId) ? prev.filter(id => id !== tripId) : [...prev, tripId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedSlips.length === trips.length && trips.length > 0) {
            setSelectedSlips([]);
        } else {
            setSelectedSlips(trips.map(t => t._id));
        }
    };

    const handleBulkDownload = () => {
        if (selectedSlips.length === 0) return;
        const tripsToDownload = trips.filter(t => selectedSlips.includes(t._id));
        generateHireSlip(tripsToDownload, preferences);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Logistics Operations</h1>
                    <p className="text-sm text-gray-500 mt-1">Total Trips: <span className="font-semibold text-indigo-600">{total}</span></p>
                </div>
                <div className="flex gap-2">
                    {selectedSlips.length > 0 && (
                        <button
                            onClick={handleBulkDownload}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
                        >
                            <FileText className="h-4 w-4" />
                            Download Selected ({selectedSlips.length})
                        </button>
                    )}
                    <button
                        onClick={() => fetchTrips()}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                        title="Refresh"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => { setSelectedTrip(null); setShowForm(true); }}
                        className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition shadow-sm"
                    >
                        New Trip
                    </button>
                </div>
            </div>

            {/* Filters */}
            {!showForm && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            <option value="">All Active</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="LOADING">Loading</option>
                            <option value="IN_TRANSIT">In Transit</option>
                            <option value="UNLOADED">Unloaded</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Consignor</label>
                        <select
                            value={consignorFilter}
                            onChange={(e) => { setConsignorFilter(e.target.value); setPage(1); }}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            <option value="">All Consignors</option>
                            {consignors.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={dateFilter.start}
                                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                                className="w-full border-gray-300 rounded-md shadow-sm text-xs"
                            />
                            <input
                                type="date"
                                value={dateFilter.end}
                                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                                className="w-full border-gray-300 rounded-md shadow-sm text-xs"
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={clearFilters}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Pagination Controls - Moved Above Table */}
            {!showForm && total > 0 && (
                <div className="flex items-center justify-between border-t border-b border-gray-200 bg-white px-4 py-3 sm:px-6 mb-4 rounded-lg shadow-sm">
                    <div className="hidden sm:flex flex-1 items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, total)}</span> of <span className="font-medium">{total}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                </button>

                                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                    Page {page} of {totalPages}
                                </span>

                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {showForm ? (
                <div className="bg-white p-6 rounded-lg shadow mb-6 relative">
                    <button
                        onClick={() => { setShowForm(false); setSelectedTrip(null); }}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                    <h2 className="text-xl font-bold mb-4">{selectedTrip ? 'Edit Trip' : 'Create New Trip'}</h2>
                    <LogisticsTripForm
                        trip={selectedTrip}
                        onCancel={() => { setShowForm(false); setSelectedTrip(null); }}
                        onSave={handleSaveTrip}
                    />
                </div>
            ) : (
                <>
                    <div className="bg-white shadow overflow-hidden rounded-lg overflow-x-auto border border-gray-200">
                        {loading ? (
                            <div className="p-12 text-center text-gray-500">Loading trips...</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={trips.length > 0 && selectedSlips.length === trips.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timings</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lorry No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consignor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">POD</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financials</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {trips.length === 0 ? (
                                        <tr>
                                            <td colSpan="10" className="px-6 py-10 text-center text-sm text-gray-500">
                                                No logistics trips found matching criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        trips.map((trip) => (
                                            <tr key={trip._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                        checked={selectedSlips.includes(trip._id)}
                                                        onChange={() => toggleSlipSelection(trip._id)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {trip.tripDateTime ? new Date(trip.tripDateTime).toLocaleDateString() : 'N/A'}
                                                    <div className="text-xs text-gray-400">Created</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {trip.startTime ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-green-600 text-xs font-semibold">Start: {new Date(trip.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                    {trip.completionTime ? (
                                                        <div className="flex flex-col mt-1">
                                                            <span className="text-blue-600 text-xs font-semibold">End: {new Date(trip.completionTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {trip.assignedDriver?.vehicleNumber || trip.vehicleNumber || 'Unassigned'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {trip.consignorId?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <span className="truncate max-w-[100px]">{trip.loadingLocation}</span>
                                                        <span className="mx-1 text-gray-400">→</span>
                                                        <span className="truncate max-w-[100px]">{trip.unloadingLocation}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                            trip.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                                trip.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-yellow-100 text-yellow-800'}`}>
                                                        {trip.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {(() => {
                                                        const pod = trip.documents && Array.isArray(trip.documents) ? trip.documents.find(d => d.type === 'POD') : null;
                                                        const podUrl = pod?.url || trip.dripSheetImage;

                                                        if (podUrl) {
                                                            return (
                                                                <a
                                                                    href={podUrl}
                                                                    download={`POD_${trip.tripId || trip._id}.jpg`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                                                                    title="Download POD (JPEG)"
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                    <span className="text-xs">JPG</span>
                                                                </a>
                                                            );
                                                        }
                                                        return <span className="text-xs text-gray-400">-</span>;
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    <div className="flex flex-col gap-2">
                                                        {/* Financial Status Badge */}
                                                        {(() => {
                                                            const receivable = trip.balanceReceivable !== undefined ? trip.balanceReceivable : (trip.totalFreight - (trip.consignorAdvance || 0));
                                                            const payable = trip.balancePayableToDriver !== undefined ? trip.balancePayableToDriver : ((trip.driverTotalPayable || (trip.driverAdvance + (trip.balancePayableToDriver || 0))) - (trip.driverAdvance || 0));
                                                            const isSettled = Math.abs(receivable) < 1 && Math.abs(payable) < 1;

                                                            return (
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${isSettled
                                                                        ? 'bg-green-100 text-green-800 border-green-200'
                                                                        : 'bg-orange-100 text-orange-800 border-orange-200'
                                                                        }`}>
                                                                        Fin: {isSettled ? 'Closed' : 'Pending'}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Consignor Receivable */}
                                                        <div className="bg-green-50 p-2 rounded border border-green-100">
                                                            <div className="text-xs font-semibold text-green-800 mb-1">Receivable (Consignor)</div>
                                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                                <div>
                                                                    <div className="text-gray-500">Total</div>
                                                                    <div className="font-medium">₹{trip.totalFreight?.toLocaleString()}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-gray-500">Adv ({trip.consignorAdvancePaymentMode})</div>
                                                                    <div className="font-medium">₹{trip.consignorAdvance?.toLocaleString() || 0}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-gray-500">Bal</div>
                                                                    <div className={`font-bold ${(trip.balanceReceivable !== undefined ? trip.balanceReceivable : (trip.totalFreight - (trip.consignorAdvance || 0))) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                        ₹{(trip.balanceReceivable !== undefined ? trip.balanceReceivable : (trip.totalFreight - (trip.consignorAdvance || 0)))?.toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Driver Payable */}
                                                        <div className="bg-red-50 p-2 rounded border border-red-100">
                                                            <div className="text-xs font-semibold text-red-800 mb-1">Payable (Driver)</div>
                                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                                <div>
                                                                    <div className="text-gray-500">Total</div>
                                                                    <div className="font-medium">₹{(trip.driverTotalPayable || (trip.driverAdvance + trip.balancePayableToDriver) || 0)?.toLocaleString()}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-gray-500">Adv ({trip.driverAdvancePaymentMode})</div>
                                                                    <div className="font-medium">₹{trip.driverAdvance?.toLocaleString() || 0}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-gray-500">Bal</div>
                                                                    <div className={`font-bold ${trip.balancePayableToDriver > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                        ₹{trip.balancePayableToDriver?.toLocaleString() || 0}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTrip(trip);
                                                            setShowForm(true);
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                                        title="Edit Trip"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default LogisticsTripList;
