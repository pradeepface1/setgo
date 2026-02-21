import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import TripList from '../components/trips/TripList';
import { tripService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useSettings } from '../context/SettingsContext';

// Fix for default marker icon
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Dashboard = () => {
    const [stats, setStats] = useState({ total: 0, online: 0, busy: 0, offline: 0 });
    const [driverLocations, setDriverLocations] = useState({}); // Map of driverId -> location data
    const socket = useSocket();
    const { t } = useTranslation();
    const { currentVertical } = useSettings(); // Get current vertical

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
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard')}</h1>
                <button
                    onClick={handleRefresh}
                    className="p-2 text-gray-500 hover:text-gray-700 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title={t('refresh_dashboard')}
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>

            {/* Map Section */}
            <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg border border-gray-200 z-0">
                <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {Object.values(driverLocations)
                        .filter(driver => driver.status !== 'OFFLINE')
                        .map(driver => (
                            <Marker key={driver.driverId} position={[driver.lat, driver.lng]}>
                                <Tooltip direction="top" offset={[0, -40]} opacity={1} permanent>
                                    <span className="font-bold text-sm">{driver.name || 'Driver'}</span>
                                </Tooltip>
                                <Popup>
                                    <div className="font-semibold">{driver.name || 'Unknown Driver'}</div>
                                    <div className="text-xs">Status: {driver.status || 'Unknown'}</div>
                                    <div className="text-xs">Speed: {driver.speed ? Math.round(driver.speed * 3.6) : 0} km/h</div>
                                </Popup>
                            </Marker>
                        ))}
                </MapContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <TripList
                        onTripUpdated={fetchStats}
                        statusFilter="PENDING"
                        title={t('pending_trips')}
                        refreshTrigger={refreshTrigger}
                    />
                </div>

                {/* Sidebar / Stats Area */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('live_status')}</h3>

                        <div className="space-y-4">

                            <Link to="/drivers?status=ONLINE" className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded px-2 -mx-2">
                                <span className="text-gray-600 dark:text-gray-300">{t('online_drivers')}</span>
                                <span className="text-xl font-bold text-green-600">{stats.online}</span>
                            </Link>
                            <Link to="/drivers?status=BUSY" className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded px-2 -mx-2">
                                <span className="text-gray-600 dark:text-gray-300">{t('busy_drivers')}</span>
                                <span className="text-xl font-bold text-orange-500">{stats.busy}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
