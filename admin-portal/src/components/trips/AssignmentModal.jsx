import React, { useEffect, useState } from 'react';
import { tripService } from '../../services/api';
import { X, User, Car, Check } from 'lucide-react';

const AssignmentModal = ({ trip, onClose, onAssignSuccess }) => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [assigning, setAssigning] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                // Fetch only ONLINE drivers ideally, but for MVP fetch all
                const data = await tripService.getDrivers();
                setDrivers(data);
            } catch (err) {
                console.error("Failed to load drivers", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDrivers();
    }, []);

    const handleAssign = async () => {
        if (!selectedDriver) {
            alert("Please select a driver first");
            return;
        }
        setAssigning(true);
        try {
            await tripService.assignDriver(trip._id, selectedDriver._id);
            onAssignSuccess();
            onClose();
        } catch (err) {
            alert("Failed to assign driver");
        } finally {
            setAssigning(false);
        }
    };


    // Filter drivers based on vehicle category and subcategory
    // Only show ONLINE drivers
    const onlineDrivers = drivers.filter(d => d.status === 'ONLINE');

    const filteredDrivers = onlineDrivers.filter(d => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            d.name.toLowerCase().includes(query) ||
            d.vehicleModel.toLowerCase().includes(query) ||
            d.vehicleNumber.toLowerCase().includes(query)
        );
    });

    const suggestedDrivers = filteredDrivers.filter(d => {
        // For new trips with vehicleCategory and vehicleSubcategory
        if (trip.vehicleCategory && trip.vehicleSubcategory) {
            // First check if category matches
            const categoryMatches = d.vehicleCategory === trip.vehicleCategory;
            if (!categoryMatches) return false;

            // Then check if vehicle model matches the subcategory
            const modelLower = d.vehicleModel.toLowerCase();
            const subcategoryLower = trip.vehicleSubcategory.toLowerCase();

            // Match if model contains subcategory or vice versa
            return modelLower.includes(subcategoryLower) || subcategoryLower.includes(modelLower);
        }

        // Legacy support for old trips with vehiclePreference
        if (trip.vehiclePreference) {
            return trip.vehiclePreference === 'Any' || d.vehicleCategory === trip.vehiclePreference;
        }

        return false;
    });

    const otherDrivers = filteredDrivers.filter(d => !suggestedDrivers.includes(d));

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-900">Assign Driver</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="mb-4 bg-gray-50 p-3 rounded text-sm text-gray-700">
                        <p><strong>Trip:</strong> {trip.pickupLocation} → {trip.dropLocation}</p>
                        <p><strong>Vehicle:</strong> {trip.vehicleCategory || trip.vehiclePreference} {trip.vehicleSubcategory && `- ${trip.vehicleSubcategory}`} • {new Date(trip.tripDateTime).toLocaleTimeString()}</p>
                    </div>

                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search by name or vehicle..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-jubilant-500 focus:border-jubilant-500 sm:text-sm"
                            autoFocus
                        />
                    </div>

                    <p className="text-sm font-medium text-gray-700 mb-2">Select Driver</p>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {loading ? <p className="text-center text-gray-500 py-4">Loading drivers...</p> : (
                            <>
                                {suggestedDrivers.length > 0 && (
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Suggested</div>
                                )}
                                {suggestedDrivers.map(driver => (
                                    <DriverOption
                                        key={driver._id}
                                        driver={driver}
                                        selected={selectedDriver?._id === driver._id}
                                        onSelect={() => setSelectedDriver(driver)}
                                        onAssignNow={() => {
                                            setSelectedDriver(driver);
                                            // Ideally call handleAssign here but state update may be async
                                            // So calling service directly
                                            setAssigning(true);
                                            tripService.assignDriver(trip._id, driver._id)
                                                .then(() => {
                                                    onAssignSuccess();
                                                    onClose();
                                                })
                                                .catch(() => alert("Failed to assign"))
                                                .finally(() => setAssigning(false));
                                        }}
                                    />
                                ))}

                                {otherDrivers.length > 0 && (
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-1">Others</div>
                                )}
                                {otherDrivers.map(driver => (
                                    <DriverOption
                                        key={driver._id}
                                        driver={driver}
                                        selected={selectedDriver?._id === driver._id}
                                        onSelect={() => setSelectedDriver(driver)}
                                        onAssignNow={() => {
                                            setAssigning(true);
                                            tripService.assignDriver(trip._id, driver._id)
                                                .then(() => {
                                                    onAssignSuccess();
                                                    onClose();
                                                })
                                                .catch(() => alert("Failed to assign"))
                                                .finally(() => setAssigning(false));
                                        }}
                                    />
                                ))}

                                {drivers.length === 0 && <p className="text-sm text-gray-500 text-center">No drivers found.</p>}
                            </>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={assigning}
                        className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 ${!selectedDriver ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {assigning ? 'Assigning...' : 'Assign Driver'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DriverOption = ({ driver, selected, onSelect, onAssignNow }) => (
    <div
        className={`flex items-center p-3 rounded-lg border transition-colors ${selected ? 'border-jubilant-500 bg-jubilant-50' : 'border-gray-200 hover:border-gray-300'}`}
    >
        <div
            onClick={onSelect}
            className="flex-1 flex items-center cursor-pointer"
        >
            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${selected ? 'bg-jubilant-200 text-jubilant-700' : 'bg-gray-100 text-gray-500'}`}>
                <User className="h-5 w-5" />
            </div>
            <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${selected ? 'text-gray-900' : 'text-gray-700'}`}>{driver.name}</p>
                <div className="flex items-center text-xs text-gray-500">
                    <Car className="h-3 w-3 mr-1" />
                    {driver.vehicleModel} ({driver.vehicleNumber})
                </div>
            </div>
        </div>

        <div className="ml-4 flex items-center gap-2">
            {driver.status === 'ONLINE' ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Online</span>
            ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{driver.status}</span>
            )}

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onAssignNow(driver);
                }}
                disabled={driver.status !== 'ONLINE'}
                className="ml-2 px-3 py-1 bg-jubilant-600 text-white text-xs font-medium rounded hover:bg-jubilant-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                Assign
            </button>
        </div>
    </div>
);

export default AssignmentModal;
