import React, { useEffect, useState } from 'react';
import { tripService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Search, Filter, User, Car, Phone, Download, Plus, Trash2, Lock, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import AddDriverModal from '../components/drivers/AddDriverModal';
import EditDriverModal from '../components/drivers/EditDriverModal';
import ResetPasswordModal from '../components/drivers/ResetPasswordModal';

import { useSearchParams } from 'react-router-dom';

const Drivers = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    // Initialize filter from URL query param, default to 'ALL'
    const [filter, setFilter] = useState(searchParams.get('status') || 'ALL');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editDriver, setEditDriver] = useState(null);
    const [passwordModalDriver, setPasswordModalDriver] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Sync state if URL changes (optional, but good for back/forward)
        const statusParam = searchParams.get('status');
        if (statusParam && (statusParam === 'ONLINE' || statusParam === 'BUSY' || statusParam === 'OFFLINE' || statusParam === 'ALL')) {
            setFilter(statusParam);
        }
    }, [searchParams]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('Auto-refreshing drivers...');
            fetchDrivers(false); // Pass false to avoid full loading spinner if desired, or handle loading differently
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleFilterChange = (newVal) => {
        setFilter(newVal);
        // Update URL
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
            const data = await tripService.getDrivers();
            setDrivers(data);
        } catch (err) {
            console.error('Failed to load drivers', err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleDriverAdded = () => {
        fetchDrivers();
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleLocationUpdate = (data) => {
            // data: { driverId, lat, lng, status }
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

    const filteredDrivers = drivers.filter(d => {
        const matchesStatus = filter === 'ALL' || d.status === filter;
        const search = searchTerm.toLowerCase();
        const matchesSearch =
            d.name.toLowerCase().includes(search) ||
            d.phone.includes(search) ||
            d.vehicleNumber.toLowerCase().includes(search) ||
            (d.organizationId && (
                (d.organizationId.displayName && d.organizationId.displayName.toLowerCase().includes(search)) ||
                (d.organizationId.name && d.organizationId.name.toLowerCase().includes(search))
            ));

        return matchesStatus && matchesSearch;
    });

    const counts = {
        ALL: drivers.length,
        ONLINE: drivers.filter(d => d.status === 'ONLINE').length,
        BUSY: drivers.filter(d => d.status === 'BUSY').length,
        OFFLINE: drivers.filter(d => d.status === 'OFFLINE').length
    };

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
        const columnWidths = [
            { wch: 20 }, // Driver Name
            { wch: 15 }, // Phone
            { wch: 15 }, // Vehicle Model
            { wch: 15 }, // Vehicle Number
            { wch: 20 }, // Vehicle Category
            { wch: 20 }, // Organization
            { wch: 12 }, // Status
            { wch: 10 }, // Rating
            { wch: 25 }  // Current Location
        ];
        worksheet['!cols'] = columnWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Drivers');

        const filename = `Jubilant_Setgo_Drivers_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, filename);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-baseline gap-2">
                    <h1 className="text-2xl font-semibold text-gray-900">Drivers</h1>
                    <span className="text-sm text-gray-500">({filteredDrivers.length} visible)</span>
                    <button
                        onClick={() => fetchDrivers()}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        title="Refresh List"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative rounded-md shadow-sm w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                            placeholder="Search drivers, orgs..."
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
                        <div className="relative inline-block text-left">
                            <input
                                type="file"
                                id="import-excel"
                                className="hidden"
                                accept=".xlsx, .xls"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = async (evt) => {
                                            try {
                                                const bstr = evt.target.result;
                                                const wb = XLSX.read(bstr, { type: 'binary' });
                                                const wsname = wb.SheetNames[0];
                                                const ws = wb.Sheets[wsname];
                                                const data = XLSX.utils.sheet_to_json(ws);

                                                console.log('Importing Data:', data);
                                                setLoading(true);

                                                let successCount = 0;
                                                let failCount = 0;

                                                for (const row of data) {
                                                    try {
                                                        // Default password if not provided
                                                        const driverData = {
                                                            name: row['Driver Name'] || row['Name'],
                                                            phone: String(row['Phone'] || row['Mobile'] || ''),
                                                            vehicleModel: row['Vehicle Model'] || row['Car Model'],
                                                            vehicleNumber: row['Vehicle Number'] || row['Car Number'],
                                                            vehicleCategory: row['Vehicle Category'] || row['Category'] || 'Sedan',
                                                            password: row['Password'] || 'password123'
                                                        };

                                                        // Basic validation
                                                        if (!driverData.name || !driverData.phone || !driverData.vehicleNumber) {
                                                            console.warn('Skipping invalid row:', row);
                                                            failCount++;
                                                            continue;
                                                        }

                                                        await tripService.createDriver(driverData);
                                                        successCount++;
                                                    } catch (err) {
                                                        console.error('Failed to import row:', row, err);
                                                        failCount++;
                                                    }
                                                }

                                                alert(`Import Complete!\nSuccess: ${successCount}\nFailed: ${failCount}`);
                                                fetchDrivers();
                                            } catch (error) {
                                                console.error('Import Error:', error);
                                                alert('Failed to parse Excel file');
                                            } finally {
                                                setLoading(false);
                                                // Reset input
                                                e.target.value = null;
                                            }
                                        };
                                        reader.readAsBinaryString(file);
                                    }
                                }}
                            />
                            <label
                                htmlFor="import-excel"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                            >
                                <Download className="h-4 w-4 mr-2 transform rotate-180" />
                                Import
                            </label>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Driver
                        </button>
                        <select
                            className="border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                            value={filter}
                            onChange={(e) => handleFilterChange(e.target.value)}
                        >
                            <option value="ALL">All Status ({counts.ALL})</option>
                            <option value="ONLINE">Online ({counts.ONLINE})</option>
                            <option value="BUSY">Busy ({counts.BUSY})</option>
                            <option value="OFFLINE">Offline ({counts.OFFLINE})</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden rounded-md">
                <ul className="divide-y divide-gray-200">
                    {loading ? (
                        <li className="p-6 text-center text-gray-500">Loading drivers...</li>
                    ) : filteredDrivers.length === 0 ? (
                        <li className="p-6 text-center text-gray-500">No drivers found matching your search.</li>
                    ) : (
                        filteredDrivers.map((driver) => (
                            <li key={driver._id} className="block hover:bg-gray-50">
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-jubilant-600 truncate">{driver.name}</div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                    {driver.phone}
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
                                                <select
                                                    value={driver.status}
                                                    onChange={async (e) => {
                                                        try {
                                                            const newStatus = e.target.value;
                                                            await tripService.updateDriverStatus(driver._id, newStatus);
                                                            // Optimistic update
                                                            setDrivers(drivers.map(d => d._id === driver._id ? { ...d, status: newStatus } : d));
                                                        } catch (err) {
                                                            alert('Failed to update status');
                                                            console.error(err);
                                                        }
                                                    }}
                                                    className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer ${driver.status === 'ONLINE' ? 'bg-green-100 text-green-800' :
                                                        driver.status === 'BUSY' ? 'bg-orange-100 text-orange-800' :
                                                            driver.status === 'OFFLINE' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    <option value="ONLINE">ONLINE</option>
                                                    <option value="BUSY">BUSY</option>
                                                    <option value="OFFLINE">OFFLINE</option>
                                                </select>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPasswordModalDriver(driver);
                                                    }}
                                                    className="p-1 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-50"
                                                    title="Reset Password"
                                                >
                                                    <Lock className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditDriver(driver);
                                                    }}
                                                    className="p-1 text-green-600 hover:text-green-900 rounded-full hover:bg-green-50"
                                                    title="Edit Driver"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation(); // Prevent row click
                                                        if (window.confirm(`Are you sure you want to delete driver ${driver.name}?`)) {
                                                            try {
                                                                await tripService.deleteDriver(driver._id);
                                                                setDrivers(drivers.filter(d => d._id !== driver._id));
                                                            } catch (err) {
                                                                console.error("Delete failed", err);
                                                                alert(err.message || "Failed to delete driver");
                                                            }
                                                        }
                                                    }}
                                                    className="p-1 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50"
                                                    title="Delete Driver"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="mt-1 flex items-center text-sm text-gray-500">
                                                <Car className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                <span>{driver.vehicleModel} <span className="text-xs text-gray-400">({driver.vehicleNumber})</span></span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {driver.vehicleCategory}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {showAddModal && (
                <AddDriverModal
                    onClose={() => setShowAddModal(false)}
                    onDriverAdded={handleDriverAdded}
                />
            )}

            {passwordModalDriver && (
                <ResetPasswordModal
                    driver={passwordModalDriver}
                    onClose={() => setPasswordModalDriver(null)}
                    onSuccess={() => {/* Maybe refresh list? Password change doesn't affect list usually */ }}
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
                />
            )}
        </div>
    );
};

export default Drivers;
