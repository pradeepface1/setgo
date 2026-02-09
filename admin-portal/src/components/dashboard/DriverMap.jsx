import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map center updates if needed
const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center);
    }, [center, map]);
    return null;
};

const DriverMap = ({ drivers }) => {
    // Default center (e.g., Bangalore or user's location)
    const defaultCenter = [12.9716, 77.5946];

    return (
        <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg border border-gray-200 z-0">
            <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {drivers.map(driver => (
                    driver.location && (
                        <Marker key={driver.id} position={[driver.location.lat, driver.location.lng]}>
                            <Popup>
                                <div className="font-semibold">{driver.name}</div>
                                <div className="text-xs text-gray-500">{driver.status}</div>
                                <div className="text-xs">Speed: {driver.speed ? Math.round(driver.speed * 3.6) : 0} km/h</div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
        </div>
    );
};

export default DriverMap;
