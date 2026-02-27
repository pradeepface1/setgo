import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LogisticsTripForm from './LogisticsTripForm';
import HandLoanModal from './HandLoanModal';
import { useSettings } from '../../context/SettingsContext';
import { tripService, consignorService } from '../../services/api';
import { Filter, ChevronLeft, ChevronRight, RefreshCw, Calendar, Truck, Edit, Download, FileText, Banknote } from 'lucide-react';
import { generateHireSlip } from '../../utils/generateHireSlip';
import { generateConsignorSlip } from '../../utils/generateConsignorSlip';
import { useAuth } from '../../context/AuthContext';

const LogisticsTripList = () => {
    const { preferences } = useAuth();
    const [trips, setTrips] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [totalPages, setTotalPages] = useState(1);
    const location = useLocation();
    const navigate = useNavigate();

    const [showForm, setShowForm] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedSlips, setSelectedSlips] = useState([]);
    const [showHandLoanModal, setShowHandLoanModal] = useState(false);
    const [handLoanBalances, setHandLoanBalances] = useState({});

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

    // Handle deep-link from Dashboard "Assign Trip"
    useEffect(() => {
        if (location.state?.openForm && location.state?.tripData) {
            setSelectedTrip(location.state.tripData);
            setShowForm(true);
            // Clear state to avoid reopening on reload
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate]);

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
                fetchHandLoanBalances(response.trips);
            } else {
                // Fallback for non-paginated API (if rollback happened)
                setTrips(response);
                setTotal(response.length);
                setTotalPages(1);
                fetchHandLoanBalances(response);
            }
        } catch (error) {
            console.error('Error fetching trips:', error);
        } finally {
            setLoading(false);
        }
    };
    const fetchHandLoanBalances = async (tripList) => {
        try {
            // Fetch all pending/partial loans to calculate balances
            const loans = await tripService.getHandLoans({ status: 'PENDING,PARTIALLY_RECOVERED' });
            const balanceMap = {};
            loans.forEach(loan => {
                const recovered = loan.recoveries?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
                const outstanding = Math.max(0, loan.amount - recovered);
                if (outstanding > 0) {
                    balanceMap[loan.driverId] = (balanceMap[loan.driverId] || 0) + outstanding;
                }
            });
            setHandLoanBalances(balanceMap);
        } catch (error) {
            console.error('Error fetching Hand Loan balances:', error);
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
            } else if (payload._id) {
                await tripService.updateTrip(payload._id, payload);
                alert('Lorry assigned and trip created successfully!');
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
                <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--theme-text-main)' }}>Access Restricted</h2>
                <p className="" style={{ color: 'var(--theme-text-muted)' }}>Please switch to Logistics vertical to view this page.</p>
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

    const handleBulkDownload = (type = 'hire') => {
        if (selectedSlips.length === 0) return;
        const tripsToDownload = trips.filter(t => selectedSlips.includes(t._id));
        if (type === 'consignor') {
            generateConsignorSlip(tripsToDownload, preferences);
        } else {
            generateHireSlip(tripsToDownload, preferences);
        }
    };

    return (
        <>
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-black transition-colors duration-500" style={{ color: 'var(--theme-text-main)', fontFamily: 'Inter, sans-serif' }}>Logistics Operations</h1>
                        <p className="text-xs uppercase tracking-widest font-bold opacity-50 mt-1 transition-colors duration-500" style={{ color: 'var(--theme-text-muted)' }}>
                            Total Trips: <span style={{ color: 'var(--theme-primary)' }}>{total}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedSlips.length > 0 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleBulkDownload('hire')}
                                    className="bg-blue-600/20 text-blue-400 border border-blue-600/30 px-3 py-1.5 rounded-xl transition shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/30"
                                >
                                    <FileText className="h-3 w-3" />
                                    Hire Slips ({selectedSlips.length})
                                </button>
                                <button
                                    onClick={() => handleBulkDownload('consignor')}
                                    className="bg-teal-600/20 text-teal-400 border border-teal-600/30 px-3 py-1.5 rounded-xl transition shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-teal-600/30"
                                >
                                    <FileText className="h-3 w-3" />
                                    Consignor ({selectedSlips.length})
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => fetchTrips()}
                            className="p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-white/5 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => { setSelectedTrip(null); setShowForm(true); }}
                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-blue-600/20 text-white"
                            style={{ backgroundColor: 'var(--theme-primary)' }}
                        >
                            New Trip
                        </button>
                        <button
                            onClick={() => setShowHandLoanModal(true)}
                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/5 border border-white/10 flex items-center gap-2"
                            style={{ color: '#7c3aed' }}
                        >
                            <Banknote className="h-4 w-4" />
                            New Hand Loan
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {!showForm && (
                    <div
                        className="p-4 rounded-xl shadow border mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end transition-colors duration-500"
                        style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                        <div>
                            <label className="block text-xs font-medium mb-1 transition-colors duration-500" style={{ color: 'var(--theme-text-muted)' }}>Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                className="w-full rounded-lg text-sm transition-all duration-300 border px-3 py-2"
                                style={{
                                    backgroundColor: 'var(--theme-bg-card)',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    color: 'var(--theme-text-main)'
                                }}
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
                            <label className="block text-xs font-medium mb-1 transition-colors duration-500" style={{ color: 'var(--theme-text-muted)' }}>Consignor</label>
                            <select
                                value={consignorFilter}
                                onChange={(e) => { setConsignorFilter(e.target.value); setPage(1); }}
                                className="w-full rounded-lg text-sm transition-all duration-300 border px-3 py-2"
                                style={{
                                    backgroundColor: 'var(--theme-bg-card)',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    color: 'var(--theme-text-main)'
                                }}
                            >
                                <option value="">All Consignors</option>
                                {consignors.map(c => (
                                    <option key={c._id} value={c._id} style={{ backgroundColor: 'var(--theme-bg-card)' }}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1 transition-colors duration-500" style={{ color: 'var(--theme-text-muted)' }}>Date Range</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={dateFilter.start}
                                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                                    className="w-full rounded-lg transition-all duration-300 border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: '#ffffff',
                                        colorScheme: 'dark'
                                    }}
                                />
                                <input
                                    type="date"
                                    value={dateFilter.end}
                                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                                    className="w-full rounded-lg transition-all duration-300 border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: '#ffffff',
                                        colorScheme: 'dark'
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <button
                                onClick={clearFilters}
                                className="text-sm underline transition-opacity hover:opacity-70"
                                style={{ color: 'var(--theme-primary)' }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Pagination Controls - Moved Above Table */}
                {!showForm && total > 0 && (
                    <div
                        className="flex items-center justify-between border-t border-b px-4 py-3 sm:px-6 mb-4 rounded-xl shadow border transition-colors duration-500"
                        style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                        <div className="hidden sm:flex flex-1 items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-widest font-bold opacity-50" style={{ color: 'var(--theme-text-muted)' }}>
                                    Showing <span style={{ color: 'var(--theme-text-main)' }}>{(page - 1) * limit + 1}</span> to <span style={{ color: 'var(--theme-text-main)' }}>{Math.min(page * limit, total)}</span> of <span style={{ color: 'var(--theme-text-main)' }}>{total}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-xl border border-white/10 overflow-hidden shadow-sm" aria-label="Pagination">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1}
                                        className="relative inline-flex items-center px-3 py-2 text-sm transition-all hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed"
                                        style={{ color: 'var(--theme-text-main)' }}
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                    </button>

                                    <span className="relative inline-flex items-center px-4 py-2 text-[10px] font-black uppercase tracking-widest border-x border-white/10" style={{ color: 'var(--theme-text-main)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                        Page {page} of {totalPages}
                                    </span>

                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === totalPages}
                                        className="relative inline-flex items-center px-3 py-2 text-sm transition-all hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed"
                                        style={{ color: 'var(--theme-text-main)' }}
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}

                {showForm ? (
                    <div
                        className="p-6 rounded-xl shadow mb-6 relative border transition-colors duration-500"
                        style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                        <button
                            onClick={() => { setShowForm(false); setSelectedTrip(null); }}
                            className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--theme-text-main)' }}
                        >
                            ✕
                        </button>
                        <h2 className="text-xl font-bold mb-4 transition-colors duration-500" style={{ color: 'var(--theme-text-main)' }}>{selectedTrip ? 'Edit Trip' : 'Create New Trip'}</h2>
                        <LogisticsTripForm
                            trip={selectedTrip}
                            onCancel={() => { setShowForm(false); setSelectedTrip(null); }}
                            onSave={handleSaveTrip}
                        />
                    </div>
                ) : (
                    <>
                        <div
                            className="shadow overflow-hidden rounded-xl overflow-x-auto border transition-colors duration-500"
                            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}
                        >
                            {loading ? (
                                <div className="p-12 text-center" style={{ color: 'var(--theme-text-muted)' }}>Loading trips...</div>
                            ) : (
                                <table className="min-w-full divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <thead style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0"
                                                    checked={trips.length > 0 && selectedSlips.length === trips.length}
                                                    onChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Date</th>
                                            <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Timings</th>
                                            <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Lorry No</th>
                                            <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Consignor</th>
                                            <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Route</th>
                                            <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Trip Status</th>
                                            <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>POD</th>
                                            <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: '#f59e0b' }}>Pending HL</th>
                                            <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Financials</th>
                                            <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        {trips.length === 0 ? (
                                            <tr>
                                                <td colSpan="11" className="px-6 py-10 text-center text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>
                                                    No logistics trips found matching criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            trips.map((trip) => (
                                                <tr key={trip._id} className="hover:bg-opacity-40 transition-colors" style={{ backgroundColor: 'transparent' }}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                            checked={selectedSlips.includes(trip._id)}
                                                            onChange={() => toggleSlipSelection(trip._id)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-[11px] font-black tracking-tight" style={{ color: 'var(--theme-text-main)', fontFamily: 'Inter, sans-serif' }}>
                                                        {trip.tripDateTime ? new Date(trip.tripDateTime).toLocaleDateString() : 'N/A'}
                                                        <div className="text-[10px] uppercase font-bold tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Created</div>
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
                                                    <td className="px-6 py-4 whitespace-nowrap text-[11px] font-black tracking-tight" style={{ color: 'var(--theme-text-main)', fontFamily: 'Inter, sans-serif' }}>
                                                        {trip.assignedDriver?.vehicleNumber || trip.vehicleNumber || 'Unassigned'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold" style={{ color: 'var(--theme-text-muted)' }}>
                                                        {trip.consignorId?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold" style={{ color: 'var(--theme-text-muted)' }}>
                                                        <div className="flex items-center">
                                                            <span className="truncate max-w-[100px]">{trip.loadingLocation}</span>
                                                            <span className="mx-1 opacity-20">→</span>
                                                            <span className="truncate max-w-[100px]">{trip.unloadingLocation}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 inline-flex text-[10px] font-black uppercase tracking-widest rounded-lg border
                                                        ${trip.status === 'COMPLETED' ? 'bg-green-600/10 text-green-500 border-green-600/20' :
                                                                trip.status === 'CANCELLED' ? 'bg-red-600/10 text-red-500 border-red-600/20' :
                                                                    trip.status === 'IN_TRANSIT' ? 'bg-blue-600/10 text-blue-500 border-blue-600/20' :
                                                                        'bg-yellow-600/10 text-yellow-500 border-yellow-600/20'}`}>
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
                                                    {/* Pending Hand Loan Column */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {(() => {
                                                            const driverId = trip.assignedDriver?._id || trip.driverId;
                                                            const pending = handLoanBalances[driverId] || 0;
                                                            if (pending > 0) {
                                                                return (
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border"
                                                                        style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}>
                                                                        ₹{pending.toLocaleString()}
                                                                    </span>
                                                                );
                                                            }
                                                            return <span style={{ color: 'var(--theme-text-muted)' }} className="text-xs">-</span>;
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
                                                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${isSettled
                                                                            ? 'bg-green-600/10 text-green-500 border-green-600/20'
                                                                            : 'bg-orange-600/10 text-orange-500 border-orange-600/20'
                                                                            }`}>
                                                                            Fin: {isSettled ? 'Closed' : 'Pending'}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* Consignor Receivable */}
                                                            <div
                                                                className="p-2 rounded border transition-colors duration-500"
                                                                style={{
                                                                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                                                    borderColor: 'rgba(16, 185, 129, 0.2)'
                                                                }}
                                                            >
                                                                <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--theme-text-main)' }}>Receivable (Consignor)</div>
                                                                <div className="grid grid-cols-3 gap-2 text-[10px]">
                                                                    <div>
                                                                        <div style={{ color: 'var(--theme-text-muted)' }}>Total</div>
                                                                        <div className="font-medium" style={{ color: 'var(--theme-text-main)' }}>₹{trip.totalFreight?.toLocaleString()}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ color: 'var(--theme-text-muted)' }}>Adv</div>
                                                                        <div className="font-medium" style={{ color: 'var(--theme-text-main)' }}>₹{trip.consignorAdvance?.toLocaleString() || 0}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ color: 'var(--theme-text-muted)' }}>Bal</div>
                                                                        <div className={`font-bold ${(trip.balanceReceivable !== undefined ? trip.balanceReceivable : (trip.totalFreight - (trip.consignorAdvance || 0))) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                            ₹{(trip.balanceReceivable !== undefined ? trip.balanceReceivable : (trip.totalFreight - (trip.consignorAdvance || 0)))?.toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Driver Payable */}
                                                            <div
                                                                className="p-2 rounded border transition-colors duration-500"
                                                                style={{
                                                                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                                                    borderColor: 'rgba(239, 68, 68, 0.2)'
                                                                }}
                                                            >
                                                                <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--theme-text-main)' }}>Payable (Driver)</div>
                                                                <div className="grid grid-cols-3 gap-2 text-[10px]">
                                                                    <div>
                                                                        <div style={{ color: 'var(--theme-text-muted)' }}>Total</div>
                                                                        <div className="font-medium" style={{ color: 'var(--theme-text-main)' }}>₹{(trip.driverTotalPayable || (trip.driverAdvance + (trip.balancePayableToDriver || 0)) || 0)?.toLocaleString()}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ color: 'var(--theme-text-muted)' }}>Adv</div>
                                                                        <div className="font-medium" style={{ color: 'var(--theme-text-main)' }}>₹{trip.driverAdvance?.toLocaleString() || 0}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ color: 'var(--theme-text-muted)' }}>Bal</div>
                                                                        <div className={`font-bold ${trip.balancePayableToDriver > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                            ₹{trip.balancePayableToDriver?.toLocaleString() || 0}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* To Pay (Consignor pays driver directly) */}
                                                            {(trip.toPayAmount > 0) && (
                                                                <div
                                                                    className="p-2 rounded border transition-colors duration-500"
                                                                    style={{
                                                                        backgroundColor: 'rgba(249, 115, 22, 0.05)',
                                                                        borderColor: 'rgba(249, 115, 22, 0.25)'
                                                                    }}
                                                                >
                                                                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#f97316' }}>To Pay</div>
                                                                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                                                                        <div>
                                                                            <div style={{ color: 'var(--theme-text-muted)' }}>Total</div>
                                                                            <div className="font-medium" style={{ color: 'var(--theme-text-main)' }}>₹{trip.toPayAmount?.toLocaleString() || 0}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ color: 'var(--theme-text-muted)' }}>Comm</div>
                                                                            <div className="font-medium text-orange-400">₹{trip.toPayCommission?.toLocaleString() || 0}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ color: 'var(--theme-text-muted)' }}>Pend</div>
                                                                            <div className={`font-bold ${(trip.toPayPendingCommission || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                                ₹{trip.toPayPendingCommission?.toLocaleString() || 0}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    const msg = `*Trip Details:*\n\n` +
                                                                        `*Lorry Number:* ${trip.assignedDriver?.vehicleNumber || trip.vehicleNumber || 'N/A'}\n` +
                                                                        `*Lorry Name:* ${trip.marketVehicle?.lorryName || 'N/A'}\n` +
                                                                        `*Driver Name:* ${trip.marketVehicle?.driverName || trip.assignedDriver?.name || 'N/A'}\n` +
                                                                        `*From:* ${trip.loadingLocation || 'N/A'}\n` +
                                                                        `*To:* ${trip.unloadingLocation || 'N/A'}\n\n` +
                                                                        `*Consignor:* ${trip.consignorId?.name || trip.consignorName || 'N/A'}\n` +
                                                                        `*Consignor Mobile:* ${trip.consignorMobile || trip.consignorId?.phone || 'N/A'}`;
                                                                    let phone = (trip.marketVehicle?.driverPhone || trip.assignedDriver?.phone || '').replace(/\D/g, '');
                                                                    if (phone.length === 10) phone = '91' + phone;
                                                                    if (!phone) { alert('No driver phone number found.'); return; }
                                                                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                                                }}
                                                                className="px-2 py-1 rounded-lg transition-all duration-300 flex items-center justify-center shrink-0 hover:opacity-80"
                                                                style={{ backgroundColor: '#25D366', color: 'white', border: '1px solid #1ebe5a' }}
                                                                title="Share with Driver via WhatsApp"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                                                                    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTrip(trip);
                                                                    setShowForm(true);
                                                                }}
                                                                className="px-2 py-1.5 rounded-xl transition-all duration-300 flex items-center justify-center shrink-0 hover:bg-white/5 border border-white/10"
                                                                style={{ color: 'var(--theme-primary)' }}
                                                                title="Edit Trip"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                        </div>
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

            <HandLoanModal
                isOpen={showHandLoanModal}
                onClose={() => setShowHandLoanModal(false)}
                onSave={() => { setRefreshTrigger(t => t + 1); }}
            />
        </>
    );
};

export default LogisticsTripList;
