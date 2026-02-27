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

        if (selectedDriver.status === 'OFFLINE') {
            const proceed = window.confirm(`Driver ${selectedDriver.name} is currently OFFLINE. Do you want to force them ONLINE and assign this trip?`);
            if (!proceed) return;
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
    const filteredDrivers = drivers.filter(d => {
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-[9999]">
            <div className="relative rounded-3xl shadow-2xl w-full max-w-md mx-4 border transition-colors duration-500 overflow-hidden"
                style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--theme-text-main)' }}>Assign Driver</h3>
                    <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-text-main)' }}>
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6 p-4 rounded-xl text-sm border shadow-sm transition-colors duration-500"
                        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}>
                        <p className="mb-1" style={{ color: 'var(--theme-text-muted)' }}>
                            <strong style={{ color: 'var(--theme-text-main)' }}>Trip:</strong> {trip.pickupLocation} → {trip.dropLocation}
                        </p>
                        <p style={{ color: 'var(--theme-text-muted)' }}>
                            <strong style={{ color: 'var(--theme-text-main)' }}>Vehicle:</strong> {trip.vehicleCategory || trip.vehiclePreference} {trip.vehicleSubcategory && `- ${trip.vehicleSubcategory}`} • {new Date(trip.tripDateTime).toLocaleTimeString()}
                        </p>
                    </div>

                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Search by name or vehicle..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                            style={{
                                backgroundColor: 'var(--theme-bg-card)',
                                borderColor: 'rgba(255,255,255,0.1)',
                                color: 'var(--theme-text-main)'
                            }}
                            autoFocus
                        />
                    </div>

                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--theme-text-muted)' }}>Select Driver</p>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {loading ? <p className="text-center py-4" style={{ color: 'var(--theme-text-muted)' }}>Loading drivers...</p> : (
                            <>
                                {suggestedDrivers.length > 0 && (
                                    <div className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--theme-primary)' }}>Suggested</div>
                                )}
                                {suggestedDrivers.map(driver => (
                                    <DriverOption
                                        key={driver._id}
                                        driver={driver}
                                        selected={selectedDriver?._id === driver._id}
                                        onSelect={() => setSelectedDriver(driver)}
                                        onAssignNow={() => {
                                            if (driver.status === 'OFFLINE') {
                                                const proceed = window.confirm(`Driver ${driver.name} is currently OFFLINE. Do you want to force them ONLINE and assign this trip?`);
                                                if (!proceed) return;
                                            }
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
                                    <div className="text-[10px] font-bold uppercase tracking-widest mt-6 mb-2 px-1" style={{ color: 'var(--theme-text-muted)' }}>Others</div>
                                )}
                                {otherDrivers.map(driver => (
                                    <DriverOption
                                        key={driver._id}
                                        driver={driver}
                                        selected={selectedDriver?._id === driver._id}
                                        onSelect={() => setSelectedDriver(driver)}
                                        onAssignNow={() => {
                                            if (driver.status === 'OFFLINE') {
                                                const proceed = window.confirm(`Driver ${driver.name} is currently OFFLINE. Do you want to force them ONLINE and assign this trip?`);
                                                if (!proceed) return;
                                            }
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

                                {drivers.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'var(--theme-text-muted)' }}>No drivers found.</p>}
                            </>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t rounded-b-lg flex justify-end space-x-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border rounded-xl text-sm font-bold transition-all hover:bg-white/5 active:scale-95"
                        style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={assigning}
                        className={`px-6 py-2 rounded-xl shadow-lg text-sm font-bold transition-all active:scale-95 flex items-center gap-2 ${!selectedDriver ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_20px_var(--theme-primary-glow)]'}`}
                        style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}
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
        onClick={onSelect}
        className={`flex items-center p-3 rounded-xl border transition-all duration-300 cursor-pointer ${selected ? 'border-[var(--theme-primary)]' : 'border-white/5 hover:border-white/10'}`}
        style={selected ? { backgroundColor: 'rgba(var(--theme-primary-rgb), 0.1)' } : { backgroundColor: 'var(--theme-bg-card)' }}
    >
        <div className="flex-1 flex items-center">
            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-300 ${selected ? 'bg-[var(--theme-primary)] text-white' : 'bg-white/5 text-slate-400'}`}>
                <User className="h-5 w-5" />
            </div>
            <div className="ml-3 flex-1">
                <p className="text-sm font-bold" style={{ color: 'var(--theme-text-main)' }}>{driver.name}</p>
                <div className="flex items-center text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                    <Car className="h-3 w-3 mr-1 opacity-50" />
                    {driver.vehicleModel} ({driver.vehicleNumber})
                </div>
            </div>
        </div>

        <div className="ml-4 flex items-center gap-2">
            {driver.status === 'ONLINE' ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20">Online</span>
            ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-slate-400 border border-white/10">{driver.status}</span>
            )}

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onAssignNow(driver);
                }}
                disabled={driver.status !== 'ONLINE'}
                className="ml-2 px-3 py-1 text-white text-[10px] font-bold uppercase rounded-lg transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
                style={{ backgroundColor: 'var(--theme-primary)' }}
            >
                Assign
            </button>
        </div>
    </div>
);

export default AssignmentModal;
