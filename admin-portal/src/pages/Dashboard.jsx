import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import TripIntakeForm from '../components/trips/TripIntakeForm';
import TripList from '../components/trips/TripList';
import { tripService } from '../services/api';
import { useSocket } from '../context/SocketContext';

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

    const fetchStats = async () => {
        try {
            const drivers = await tripService.getDrivers();
            setStats({
                total: drivers.length,
                online: drivers.filter(d => d.status === 'ONLINE').length,
                busy: drivers.filter(d => d.status === 'BUSY').length,
                offline: drivers.filter(d => d.status === 'OFFLINE').length
            });
        } catch (err) {
            console.error('Failed to load stats');
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleLocationUpdate = (data) => {
            console.log('Received location update:', data);
            setDriverLocations(prev => ({
                ...prev,
                [data.driverId]: data
            }));
        };

        socket.on('driverLocationUpdate', handleLocationUpdate);

        return () => {
            socket.off('driverLocationUpdate', handleLocationUpdate);
        };
    }, [socket]);

    const handleTripCreated = () => {
        if (window.refreshTrips) window.refreshTrips();
    };

    const defaultCenter = [12.9716, 77.5946]; // Bangalore center

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            </div>

            {/* Map Section */}
            <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg border border-gray-200 z-0">
                <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {Object.values(driverLocations).map(driver => (
                        <Marker key={driver.driverId} position={[driver.lat, driver.lng]}>
                            <Popup>
                                <div className="font-semibold">Driver: {driver.driverId}</div>
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
                    <TripIntakeForm onTripCreated={() => { handleTripCreated(); fetchStats(); }} />
                    <TripList onTripUpdated={fetchStats} statusFilter="PENDING" title="Pending Trips" />
                </div>

                {/* Sidebar / Stats Area */}
                <div className="space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Live Status</h3>

                        <div className="space-y-4">

                            <Link to="/drivers?status=ONLINE" className="flex justify-between items-center py-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer rounded px-2 -mx-2">
                                <span className="text-gray-600">Online Drivers</span>
                                <span className="text-xl font-bold text-green-600">{stats.online}</span>
                            </Link>
                            <Link to="/drivers?status=BUSY" className="flex justify-between items-center py-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer rounded px-2 -mx-2">
                                <span className="text-gray-600">Busy Drivers</span>
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
