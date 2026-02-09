import { useState, useEffect } from 'react';
import { tripService } from '../services/api';
import './TripHistory.css';

function TripHistory({ driver }) {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const data = await tripService.getTripHistory(driver._id);
            setTrips(data);
        } catch (err) {
            setError('Failed to load trip history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [driver._id]);

    if (loading) {
        return (
            <div className="history-loading">
                <div className="loading-spinner"></div>
                <p>Loading history...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-message">
                {error}
            </div>
        );
    }

    return (
        <div className="trip-history">
            <h2>Trip History ({trips.length})</h2>

            {trips.length === 0 ? (
                <div className="no-history">
                    <p>No trip history yet</p>
                    <p className="no-history-subtitle">Completed and cancelled trips will appear here</p>
                </div>
            ) : (
                <div className="history-list">
                    {trips.map((trip) => (
                        <div key={trip._id} className={`history-card ${trip.status.toLowerCase()}`}>
                            <div className="history-header">
                                <div>
                                    <span className="trip-customer">{trip.customerName}</span>
                                    <span className={`status-badge ${trip.status.toLowerCase()}`}>
                                        {trip.status}
                                    </span>
                                </div>
                                <span className="trip-date">
                                    {new Date(trip.tripDateTime).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="trip-route">
                                <div className="route-point">
                                    <span className="route-label">Pickup</span>
                                    <span className="route-location">{trip.pickupLocation}</span>
                                </div>
                                <div className="route-arrow">→</div>
                                <div className="route-point">
                                    <span className="route-label">Drop</span>
                                    <span className="route-location">{trip.dropLocation}</span>
                                </div>
                            </div>

                            {trip.vehicleCategory && (
                                <div className="trip-vehicle">
                                    <span className="vehicle-badge category">{trip.vehicleCategory}</span>
                                    {trip.vehicleSubcategory && (
                                        <span className="vehicle-badge subcategory">{trip.vehicleSubcategory}</span>
                                    )}
                                </div>
                            )}

                            <div className="trip-time">
                                <svg className="time-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(trip.tripDateTime).toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TripHistory;
