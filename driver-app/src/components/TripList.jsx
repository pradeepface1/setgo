import { useState, useEffect } from 'react';
import { tripService } from '../services/api';
import TripHistory from './TripHistory';
import TripCompletionModal from './TripCompletionModal';
import './TripList.css';

function TripList({ driver, onLogout }) {
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actioningTripId, setActioningTripId] = useState(null);
    const [completingTrip, setCompletingTrip] = useState(null);

    const fetchTrips = async () => {
        try {
            setLoading(true);
            const data = await tripService.getAssignedTrips(driver._id);
            setTrips(data);
        } catch (err) {
            setError('Failed to load trips');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'active') {
            fetchTrips();
            // Poll for updates every 30 seconds
            const interval = setInterval(fetchTrips, 30000);
            return () => clearInterval(interval);
        }
    }, [driver._id, activeTab]);

    const handleAccept = async (tripId) => {
        setActioningTripId(tripId);
        try {
            await tripService.acceptTrip(tripId);
            await fetchTrips();
        } catch (err) {
            alert('Failed to accept trip: ' + err.message);
        } finally {
            setActioningTripId(null);
        }
    };

    const handleStart = async (tripId) => {
        if (!window.confirm('Are you certain you want to START this trip?')) {
            return;
        }

        setActioningTripId(tripId);
        try {
            await tripService.startTrip(tripId); // No OTP
            await fetchTrips();
        } catch (err) {
            alert('Failed to start trip: ' + err.message);
        } finally {
            setActioningTripId(null);
        }
    };

    const handleCompleteClick = (trip) => {
        setCompletingTrip(trip);
    };

    const handleModalComplete = async (formData) => {
        if (!completingTrip) return;

        setActioningTripId(completingTrip._id);
        try {
            await tripService.completeTrip(completingTrip._id, formData);
            setCompletingTrip(null);
            await fetchTrips();
        } catch (err) {
            console.error(err);
            alert('Failed to complete trip: ' + err.message);
        } finally {
            setActioningTripId(null);
        }
    };

    const handleCancel = async (tripId) => {
        if (!window.confirm('Are you sure you want to cancel this trip?')) {
            return;
        }

        setActioningTripId(tripId);
        try {
            await tripService.cancelTrip(tripId);
            await fetchTrips();
        } catch (err) {
            alert('Failed to cancel trip');
        } finally {
            setActioningTripId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('driver');
        onLogout();
    };

    return (
        <div className="trip-list-container">
            <div className="header">
                <div>
                    <h1>SetGo Driver App</h1>
                    <p className="driver-name">Welcome, {driver.name}</p>
                </div>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>

            {error && activeTab === 'active' && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="trips-section">
                {/* Tab Navigation */}
                <div className="tab-navigation">
                    <button
                        className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active Trips
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        History
                    </button>
                </div>

                {/* Active Trips Tab */}
                {activeTab === 'active' && (
                    <>
                        {loading && trips.length === 0 ? (
                            <div className="loading">Loading trips...</div>
                        ) : trips.length === 0 ? (
                            <div className="no-trips">
                                <p>No trips assigned yet</p>
                                <p className="no-trips-subtitle">Check back later for new assignments</p>
                            </div>
                        ) : (
                            <div className="trips-list">
                                {trips.map((trip) => (
                                    <div key={trip._id} className="trip-card">
                                        <div className="trip-header">
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span className="trip-customer">{trip.customerName}</span>
                                                <a href={`tel:${trip.customerPhone}`} className="trip-phone" style={{ fontSize: '14px', color: '#2196F3', textDecoration: 'none', marginTop: '4px' }}>
                                                    📞 {trip.customerPhone}
                                                </a>
                                            </div>
                                            <span className="trip-time">
                                                {new Date(trip.tripDateTime).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="trip-route">
                                            <div className="route-point">
                                                <span className="route-label">Pickup</span>
                                                <span className="route-location">{trip.pickupLocation}</span>
                                                {trip.pickupType && trip.pickupType !== 'OTHERS' && (
                                                    <span style={{ fontSize: '12px', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                                                        {trip.pickupType.replace('_', ' ')}
                                                    </span>
                                                )}
                                                {(trip.pickupContext?.flightNumber || trip.pickupContext?.trainNumber || trip.pickupContext?.busNumber) && (
                                                    <div style={{ fontSize: '13px', color: '#d97706', marginTop: '4px', fontWeight: '500' }}>
                                                        {trip.pickupContext.flightNumber && `✈️ Flight: ${trip.pickupContext.flightNumber}`}
                                                        {trip.pickupContext.trainNumber && `🚆 Train: ${trip.pickupContext.trainNumber}`}
                                                        {trip.pickupContext.busNumber && `🚌 Bus: ${trip.pickupContext.busNumber}`}
                                                    </div>
                                                )}
                                                {trip.googleLocation && (
                                                    <a
                                                        href={trip.googleLocation}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ display: 'inline-flex', alignItems: 'center', marginTop: '8px', padding: '6px 12px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: '500' }}
                                                    >
                                                        📍 Navigate to Pickup
                                                    </a>
                                                )}
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

                                        <div className="trip-actions">
                                            {trip.status === 'ASSIGNED' && (
                                                <button
                                                    onClick={() => handleAccept(trip._id)}
                                                    disabled={actioningTripId === trip._id}
                                                    className="action-button accept"
                                                    style={{ backgroundColor: '#4CAF50', color: 'white' }}
                                                >
                                                    {actioningTripId === trip._id ? 'Processing...' : 'Accept Trip'}
                                                </button>
                                            )}

                                            {trip.status === 'ACCEPTED' && (
                                                <button
                                                    onClick={() => handleStart(trip._id)}
                                                    disabled={actioningTripId === trip._id}
                                                    className="action-button start"
                                                    style={{ backgroundColor: '#2196F3', color: 'white' }}
                                                >
                                                    {actioningTripId === trip._id ? 'Processing...' : 'Start Trip'}
                                                </button>
                                            )}

                                            {trip.status === 'STARTED' && (
                                                <button
                                                    onClick={() => handleCompleteClick(trip)}
                                                    disabled={actioningTripId === trip._id}
                                                    className="action-button complete"
                                                >
                                                    {actioningTripId === trip._id ? 'Processing...' : 'Complete Trip'}
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleCancel(trip._id)}
                                                disabled={actioningTripId === trip._id}
                                                className="action-button cancel"
                                            >
                                                {actioningTripId === trip._id ? 'Processing...' : 'Cancel'}
                                            </button>
                                        </div>
                                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                                            Status: <strong>{trip.status}</strong>
                                            {trip.status === 'ACCEPTED' && <span> (Wait for passenger)</span>}
                                            {trip.status === 'STARTED' && <span> (Trip in progress)</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                        }
                    </>
                )}

                {/* History Tab */}
                {
                    activeTab === 'history' && (
                        <TripHistory driver={driver} />
                    )
                }
            </div >

            {/* Trip Completion Modal */}
            {
                completingTrip && (
                    <TripCompletionModal
                        trip={completingTrip}
                        onClose={() => setCompletingTrip(null)}
                        onComplete={handleModalComplete}
                    />
                )
            }
        </div >
    );
}

export default TripList;
