import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { RefreshCw, Plus } from 'lucide-react';
import TripList from '../components/trips/TripList';
import AvailableLorryList from '../components/trips/AvailableLorryList';
import MapLibreDriverMap from '../components/dashboard/MapLibreDriverMap';
import { tripService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useSettings } from '../context/SettingsContext';
import LogisticsTripForm from '../components/logistics/LogisticsTripForm';

const Dashboard = () => {
    const [stats, setStats] = useState({ total: 0, online: 0, busy: 0, offline: 0 });
    const [driverLocations, setDriverLocations] = useState({}); // Map of driverId -> location data
    const [showCreateModal, setShowCreateModal] = useState(false);
    const socket = useSocket();
    const { t } = useTranslation();
    const { currentVertical } = useSettings(); // Get current vertical

    const handleTripCreated = () => {
        setRefreshTrigger(prev => prev + 1);
        setShowCreateModal(false);
        fetchStats();
    };

    const handleSaveLorryDraft = async (payload) => {
        try {
            await tripService.createTrip({ ...payload, vertical: 'LOGISTICS' });
            handleTripCreated();
        } catch (error) {
            console.error('Error saving lorry draft', error);
            alert('Failed to save Lorry Draft. Please check the console.');
        }
    };

    const fetchStats = async () => {
        try {
            // Pass vertical to getDrivers
            const params = { vertical: currentVertical };
            const drivers = await tripService.getDrivers(params);

            setStats({
                total: drivers.length,
                online: drivers.filter(d => d.status === 'ONLINE').length,
                busy: drivers.filter(d => d.status === 'BUSY').length,
                offline: drivers.filter(d => d.status === 'OFFLINE').length
            });

            // Populate map with initial locations
            const initialLocations = {};
            drivers.forEach(d => {
                if (d.currentLocation && d.currentLocation.lat && d.currentLocation.lng) {
                    initialLocations[d._id] = {
                        driverId: d._id,
                        lat: d.currentLocation.lat,
                        lng: d.currentLocation.lng,
                        status: d.status,
                        name: d.name,
                        speed: d.speed // Capture speed if available
                    };
                }
            });
            setDriverLocations(initialLocations);
        } catch (err) {
            console.error('Failed to load stats');
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [currentVertical]); // Re-fetch when vertical changes

    useEffect(() => {
        if (!socket) return;

        const handleLocationUpdate = (data) => {
            setDriverLocations(prev => {
                const existing = prev[data.driverId] || {};
                return {
                    ...prev,
                    [data.driverId]: {
                        ...existing, // Preserve existing fields (like name)
                        ...data      // Update location/status
                    }
                };
            });
        };

        socket.on('driverLocationUpdate', handleLocationUpdate);

        // Also listen for general driver updates to keep names fresh
        const handleDriverUpdate = (updatedDriver) => {
            setDriverLocations(prev => {
                const existing = prev[updatedDriver._id] || {};
                // Only update if we are tracking this driver or if they are online
                if (existing.driverId || updatedDriver.status === 'ONLINE') {
                    return {
                        ...prev,
                        [updatedDriver._id]: {
                            ...existing,
                            ...updatedDriver,
                            driverId: updatedDriver._id // Ensure ID consistency
                        }
                    };
                }
                return prev;
            });
        };

        return () => {
            socket.off('driverLocationUpdate', handleLocationUpdate);
        };
    }, [socket]);

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        fetchStats();
        setRefreshTrigger(prev => prev + 1);
    };

    const defaultCenter = [12.9716, 77.5946]; // Bangalore center

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold transition-colors duration-500" style={{ color: 'var(--theme-text-main)' }}>{t('dashboard')}</h1>
                <button
                    onClick={handleRefresh}
                    className="p-2 transition-colors duration-300 rounded-full shadow-lg border backdrop-blur-sm"
                    style={{
                        backgroundColor: 'var(--theme-bg-sidebar)',
                        color: 'var(--theme-text-main)',
                        borderColor: 'rgba(255,255,255,0.1)'
                    }}
                    title={t('refresh_dashboard')}
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>

            {/* Map Section */}
            <MapLibreDriverMap
                drivers={Object.values(driverLocations).filter(d => d.status !== 'OFFLINE')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mt-2 mb-4 px-2">
                        <h2 className="text-xl font-bold transition-colors duration-500" style={{ color: 'var(--theme-text-main)' }}>Vehicle Availability</h2>
                        {currentVertical === 'LOGISTICS' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Quick Add Lorry (Draft)
                            </button>
                        )}
                    </div>
                    {currentVertical === 'LOGISTICS' && (
                        <AvailableLorryList
                            refreshTrigger={refreshTrigger}
                            onTripUpdated={fetchStats}
                            onQuickAdd={() => setShowCreateModal(true)}
                        />
                    )}
                    {currentVertical !== 'LOGISTICS' && (
                        <TripList
                            onTripUpdated={fetchStats}
                            statusFilter="PENDING"
                            title={t('pending_trips')}
                            refreshTrigger={refreshTrigger}
                        />
                    )}
                </div>

                {/* Sidebar / Stats Area */}
                <div className="space-y-6">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/20 dark:border-slate-800/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all duration-700" />

                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <span className="h-5 w-1.5 bg-indigo-600 rounded-full" />
                            {t('live_status')}
                        </h3>

                        <div className="space-y-4">
                            <Link to="/drivers?status=ONLINE" className="flex justify-between items-center p-4 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-300 cursor-pointer rounded-2xl border border-emerald-100/50 dark:border-emerald-500/10 group/item">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover/item:scale-110 transition-transform">
                                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{t('online_drivers')}</span>
                                </div>
                                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.online}</span>
                            </Link>

                            <Link to="/drivers?status=BUSY" className="flex justify-between items-center p-4 bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-300 cursor-pointer rounded-2xl border border-amber-100/50 dark:border-amber-500/10 group/item">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover/item:scale-110 transition-transform">
                                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{t('busy_drivers')}</span>
                                </div>
                                <span className="text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{stats.busy}</span>
                            </Link>

                            <div className="pt-4 flex items-center justify-between text-slate-400 dark:text-slate-500 px-2 mt-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest">{t('total_fleet')}</span>
                                <span className="text-sm font-bold">{stats.total} Assets</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showCreateModal && currentVertical === 'LOGISTICS' && (
                <LogisticsTripForm
                    onSave={handleSaveLorryDraft}
                    onCancel={() => setShowCreateModal(false)}
                    isQuickAdd={true} // Add Prop to indicate Draft/Quick mode
                />
            )}
        </div>
    );
};

export default Dashboard;
