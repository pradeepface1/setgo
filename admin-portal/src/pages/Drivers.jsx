import React, { useEffect, useState } from 'react';
import { tripService } from '../services/api';
import { Search, Filter, User, Car, Phone, Download, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
import AddDriverModal from '../components/drivers/AddDriverModal';

import { useSearchParams } from 'react-router-dom';

const Drivers = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    // Initialize filter from URL query param, default to 'ALL'
    const [filter, setFilter] = useState(searchParams.get('status') || 'ALL');
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        // Sync state if URL changes (optional, but good for back/forward)
        const statusParam = searchParams.get('status');
        if (statusParam && (statusParam === 'ONLINE' || statusParam === 'BUSY' || statusParam === 'ALL')) {
            setFilter(statusParam);
        }
    }, [searchParams]);

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

    const fetchDrivers = async () => {
        try {
            const data = await tripService.getDrivers();
            setDrivers(data);
        } catch (err) {
            console.error('Failed to load drivers', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDriverAdded = () => {
        fetchDrivers();
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    const filteredDrivers = drivers.filter(d =>
        filter === 'ALL' || d.status === filter
    );

    const counts = {
        ALL: drivers.length,
        ONLINE: drivers.filter(d => d.status === 'ONLINE').length,
        BUSY: drivers.filter(d => d.status === 'BUSY').length
    };

    const handleExportToExcel = () => {
        const exportData = drivers.map(driver => ({
            'Driver Name': driver.name,
            'Phone': driver.phone,
            'Vehicle Model': driver.vehicleModel,
            'Vehicle Number': driver.vehicleNumber,
            'Vehicle Category': driver.vehicleCategory,
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
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleExportToExcel}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export to Excel
                    </button>
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
                    </select>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden rounded-md">
                <ul className="divide-y divide-gray-200">
                    {loading ? (
                        <li className="p-6 text-center text-gray-500">Loading drivers...</li>
                    ) : filteredDrivers.length === 0 ? (
                        <li className="p-6 text-center text-gray-500">No drivers found.</li>
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
                                            </div>
                                        </div>
                                        <div className="ml-2 flex flex-col items-end">
                                            <select
                                                value={driver.status}
                                                onChange={async (e) => {
                                                    try {
                                                        const newStatus = e.target.value;
                                                        await tripService.updateDriverStatus(driver._id, newStatus);
                                                        // Optimistic update or refetch
                                                        setDrivers(drivers.map(d => d._id === driver._id ? { ...d, status: newStatus } : d));
                                                    } catch (err) {
                                                        alert('Failed to update status');
                                                        console.error(err);
                                                    }
                                                }}
                                                className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer ${driver.status === 'ONLINE' ? 'bg-green-100 text-green-800' :
                                                    driver.status === 'BUSY' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                <option value="ONLINE">ONLINE</option>
                                                <option value="BUSY">BUSY</option>
                                            </select>

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
        </div>
    );
};

export default Drivers;
