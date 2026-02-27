import React, { useEffect, useState } from 'react';
import { tripService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Search, User, Phone, Download, Plus, Trash2, Lock, RefreshCw, AlertCircle, Car, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import AddDriverModal from '../components/drivers/AddDriverModal';
import EditDriverModal from '../components/drivers/EditDriverModal';
import ResetPasswordModal from '../components/drivers/ResetPasswordModal';
import BulkUploadModal from '../components/common/BulkUploadModal';
import { useSearchParams } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const Drivers = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [drivers, setDrivers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(searchParams.get('status') || 'ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editDriver, setEditDriver] = useState(null);
    const [passwordModalDriver, setPasswordModalDriver] = useState(null);
    const [error, setError] = useState(null);

    const { currentVertical } = useSettings();

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Update URL when filter changes
    useEffect(() => {
        const statusParam = searchParams.get('status');
        if (statusParam && ['ONLINE', 'BUSY', 'OFFLINE', 'ALL'].includes(statusParam)) {
            setFilter(statusParam);
        }
    }, [searchParams]);

    // Fetch Drivers when dependencies change
    useEffect(() => {
        fetchDrivers();
    }, [currentVertical, page, filter, debouncedSearch]);

    // Auto-refresh every 60s (only refetch current page)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchDrivers(false);
        }, 60000);
        return () => clearInterval(interval);
    }, [currentVertical, page, filter, debouncedSearch]);

    const handleFilterChange = (newVal) => {
        setFilter(newVal);
        setPage(1);
        if (newVal === 'ALL') {
            searchParams.delete('status');
            setSearchParams(searchParams);
        } else {
            setSearchParams({ status: newVal });
        }
    };

    const fetchDrivers = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const params = {
                status: filter === 'ALL' ? undefined : filter,
                vertical: currentVertical,
                page,
                limit,
                search: debouncedSearch
            };
            const data = await tripService.getDrivers(params);

            if (data.drivers) {
                setDrivers(data.drivers);
                setTotal(data.total);
                setTotalPages(data.totalPages);
            } else {
                // Fallback
                setDrivers(data);
                setTotal(data.length);
                setTotalPages(1);
            }
            setError(null);
        } catch (err) {
            console.error('Failed to load drivers', err);
            setError(err.message || 'Failed to load drivers');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleDriverAdded = () => {
        fetchDrivers();
        setPage(1);
    };

    // Socket updates
    const socket = useSocket();
    useEffect(() => {
        if (!socket) return;
        const handleLocationUpdate = (data) => {
            setDrivers(prevDrivers => prevDrivers.map(driver => {
                if (driver._id === data.driverId) {
                    return {
                        ...driver,
                        status: data.status || driver.status,
                        currentLocation: { lat: data.lat, lng: data.lng }
                    };
                }
                return driver;
            }));
        };
        socket.on('driverLocationUpdate', handleLocationUpdate);
        return () => {
            socket.off('driverLocationUpdate', handleLocationUpdate);
        };
    }, [socket]);

    const handleExportToExcel = () => {
        const exportData = drivers.map(driver => ({
            'Driver Name': driver.name,
            'Phone': driver.phone,
            'Vehicle Model': driver.vehicleModel,
            'Vehicle Number': driver.vehicleNumber,
            'Vehicle Category': driver.vehicleCategory,
            'Organization': driver.organizationId ? (driver.organizationId.displayName || driver.organizationId.name) : 'N/A',
            'Status': driver.status,
            'Rating': driver.rating,
            'Current Location': driver.currentLocation ? `${driver.currentLocation.lat}, ${driver.currentLocation.lng}` : 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        // ... (styling logic skipped for brevity, standard export)
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Drivers');
        const filename = `Jubilant_Setgo_Drivers_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, filename);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-baseline gap-2">
                    <h1 className="text-2xl font-semibold transition-colors duration-500" style={{ color: 'var(--theme-text-main)' }}>
                        {currentVertical === 'LOGISTICS' ? 'Road Pilots' : 'Drivers'}
                    </h1>
                    <span className="text-sm transition-colors duration-500" style={{ color: 'var(--theme-text-muted)' }}>
                        Total: <span className="font-medium" style={{ color: 'var(--theme-text-main)' }}>{total}</span>
                    </span>
                    <button
                        onClick={() => fetchDrivers()}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        title="Refresh List"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative rounded-xl overflow-hidden w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 opacity-50" style={{ color: 'var(--theme-text-main)' }} />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 text-xs font-bold transition-all focus:outline-none py-2.5"
                            style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                            placeholder="Search name, phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleExportToExcel}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </button>
                        <button
                            onClick={() => setIsBulkModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border text-xs font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-white/5"
                            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)', backgroundColor: 'transparent' }}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Import CSV
                        </button>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold uppercase tracking-widest rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {currentVertical === 'LOGISTICS' ? 'Add Road Pilot' : 'Add Driver'}
                        </button>
                        <select
                            className="border rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all focus:outline-none"
                            style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                            value={filter}
                            onChange={(e) => handleFilterChange(e.target.value)}
                        >
                            <option value="ALL">All Status</option>
                            <option value="ONLINE">Online</option>
                            <option value="BUSY">Busy</option>
                            <option value="OFFLINE">Offline</option>
                        </select>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            <div
                className="shadow overflow-hidden rounded-xl border transition-colors duration-500"
                style={{
                    backgroundColor: 'var(--theme-bg-card)',
                    borderColor: 'rgba(255,255,255,0.05)'
                }}
            >
                <ul className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {loading ? (
                        <li className="p-6 text-center" style={{ color: 'var(--theme-text-muted)' }}>Loading drivers...</li>
                    ) : drivers.length === 0 ? (
                        <li className="p-6 text-center" style={{ color: 'var(--theme-text-muted)' }}>No drivers found matching your search.</li>
                    ) : (
                        drivers.map((driver) => (
                            <li key={driver._id} className="block transition-colors" style={{ '--tw-hover-bg': 'rgba(255,255,255,0.04)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--theme-text-muted)' }}>
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-black tracking-tight" style={{ color: 'var(--theme-text-main)', fontFamily: 'Inter, sans-serif' }}>{driver.name}</div>
                                                <div className="flex items-center text-xs opacity-60 mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                                                    <Phone className="flex-shrink-0 mr-1.5 h-3 w-3" />
                                                    <span className="font-bold">{driver.phone}</span>
                                                    <a
                                                        href={`https://wa.me/91${driver.phone.replace(/\\D/g, '').slice(-10)}`}
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
                                                {driver.organizationId && (
                                                    <div className="mt-1 text-xs text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded">
                                                        Org: {driver.organizationId.displayName || driver.organizationId.name || 'SetGo'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-2 flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-semibold rounded-full px-2 py-1 ${driver.status === 'ONLINE' ? 'bg-green-100 text-green-800' :
                                                    driver.status === 'BUSY' ? 'bg-orange-100 text-orange-800' :
                                                        driver.status === 'OFFLINE' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {driver.status}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPasswordModalDriver(driver);
                                                    }}
                                                    className="p-1 text-blue-600 hover:text-blue-900"
                                                    title="Reset Password"
                                                >
                                                    <Lock className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditDriver(driver);
                                                    }}
                                                    className="p-1 text-green-600 hover:text-green-900"
                                                    title="Edit"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Are you sure you want to delete ${driver.name}?`)) {
                                                            try {
                                                                await tripService.deleteDriver(driver._id);
                                                                fetchDrivers();
                                                            } catch (err) { alert(err.message); }
                                                        }
                                                    }}
                                                    className="p-1 text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="mt-1 flex items-center text-sm text-gray-500">
                                                <Car className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                <span>{driver.vehicleModel} <span className="text-xs text-gray-400">({driver.vehicleNumber})</span></span>
                                            </div>
                                            {driver.vertical === 'LOGISTICS' && driver.ownerName && (
                                                <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-3">
                                                    <span>👤 {driver.ownerName}</span>
                                                    {driver.ownerPhone && <span>📞 {driver.ownerPhone}</span>}
                                                    {driver.ownerHometown && <span>📍 {driver.ownerHometown}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Pagination Controls */}
            {total > 0 && (
                <div
                    className="flex items-center justify-between border-t px-4 py-3 sm:px-6 rounded-xl shadow-sm mt-4 transition-colors duration-500"
                    style={{
                        backgroundColor: 'var(--theme-bg-card)',
                        borderColor: 'rgba(255,255,255,0.05)'
                    }}
                >
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex flex-1 items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-widest font-bold opacity-50" style={{ color: 'var(--theme-text-muted)' }}>
                                Showing <span style={{ color: 'var(--theme-text-main)' }}>{(page - 1) * limit + 1}</span> to <span style={{ color: 'var(--theme-text-main)' }}>{Math.min(page * limit, total)}</span> of <span style={{ color: 'var(--theme-text-main)' }}>{total}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)' }} aria-label="Pagination">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="relative inline-flex items-center px-3 py-2 text-sm transition-all hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed"
                                    style={{ color: 'var(--theme-text-main)' }}
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <span className="relative inline-flex items-center px-4 py-2 text-[10px] font-black uppercase tracking-widest border-x" style={{ color: 'var(--theme-text-main)', borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
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

            {showAddModal && (
                <AddDriverModal
                    onClose={() => setShowAddModal(false)}
                    onDriverAdded={handleDriverAdded}
                    vertical={currentVertical}
                />
            )}

            {passwordModalDriver && (
                <ResetPasswordModal
                    driver={passwordModalDriver}
                    onClose={() => setPasswordModalDriver(null)}
                    onSuccess={() => { }}
                />
            )}

            {editDriver && (
                <EditDriverModal
                    driver={editDriver}
                    onClose={() => setEditDriver(null)}
                    onDriverUpdated={() => {
                        fetchDrivers();
                        setEditDriver(null);
                    }}
                    vertical={currentVertical}
                />
            )}

            {isBulkModalOpen && (
                <BulkUploadModal
                    onClose={() => setIsBulkModalOpen(false)}
                    onUploadSuccess={fetchDrivers}
                    title={currentVertical === 'LOGISTICS' ? "Bulk Import Road Pilots" : "Bulk Import Drivers"}
                    expectedColumns={
                        currentVertical === 'LOGISTICS'
                            ? [
                                'DriverName (Compulsory)', 'MobileNumber (Compulsory)', 'Password (Compulsory)', 'VehicleNumber (Compulsory)',
                                'VehicleCategory (Compulsory)', 'VehicleModel (Compulsory)', 'Status (Compulsory)',
                                'LorryName', 'OwnerName', 'OwnerPhone', 'OwnerHometown', 'PANNumber', 'PANCardName',
                                'Bank_AccountName', 'Bank_BankName', 'Bank_AccountNumber', 'Bank_IFSC', 'Bank_UPINumber',
                                'SecondaryBank_AccountName', 'SecondaryBank_BankName', 'SecondaryBank_AccountNumber', 'SecondaryBank_IFSC', 'SecondaryBank_UPINumber'
                            ]
                            : ['DriverName (Compulsory)', 'MobileNumber (Compulsory)', 'Password (Compulsory)', 'VehicleNumber (Compulsory)', 'VehicleCategory (Compulsory)', 'VehicleModel (Compulsory)', 'Status (Compulsory)']
                    }
                    sampleData={
                        currentVertical === 'LOGISTICS'
                            ? [{
                                'DriverName (Compulsory)': 'Raju Bhai',
                                'MobileNumber (Compulsory)': '9999999991',
                                'Password (Compulsory)': 'pass123',
                                'VehicleNumber (Compulsory)': 'KA01AB1234',
                                'VehicleCategory (Compulsory)': '10 wheeler',
                                'VehicleModel (Compulsory)': 'Tata LPT',
                                'Status (Compulsory)': 'OFFLINE',
                                'LorryName': 'Sri Sai Logistics',
                                'OwnerName': 'Srinivas',
                                'OwnerPhone': '9988776655',
                                'OwnerHometown': 'Salem',
                                'PANNumber': 'ABCDE1234F',
                                'PANCardName': 'SRINIVAS R',
                                'Bank_AccountName': 'Raju Bhai',
                                'Bank_BankName': 'SBI',
                                'Bank_AccountNumber': '1234567890',
                                'Bank_IFSC': 'SBIN0001234',
                                'Bank_UPINumber': '9999999991@ybl',
                                'SecondaryBank_AccountName': 'Raju Bhai Self',
                                'SecondaryBank_BankName': 'HDFC',
                                'SecondaryBank_AccountNumber': '0987654321',
                                'SecondaryBank_IFSC': 'HDFC0001234',
                                'SecondaryBank_UPINumber': '9999999991@hdfc'
                            }]
                            : [{ 'DriverName (Compulsory)': 'Kishore', 'MobileNumber (Compulsory)': '8888888881', 'Password (Compulsory)': 'pass123', 'VehicleNumber (Compulsory)': 'KA02XY5678', 'VehicleCategory (Compulsory)': 'Sedan Regular', 'VehicleModel (Compulsory)': 'Swift Dzire', 'Status (Compulsory)': 'ONLINE' }]
                    }
                    uploadEndpoint={tripService.bulkCreateDriver}
                />
            )}
        </div>
    );
};

export default Drivers;
