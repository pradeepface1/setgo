import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { tripService, sosService } from '../services/api';
import { VEHICLE_CATEGORIES } from '../config/vehicles';
import './TripRequestForm.css';

function TripRequestForm() {
    const { user, logout } = useAuth();
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        pickupLocation: '',
        dropLocation: '',
        tripDateTime: '',
        vehicleCategory: '',
        vehicleSubcategory: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [sosLoading, setSosLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Reset subcategory when category changes
            ...(name === 'vehicleCategory' ? { vehicleSubcategory: '' } : {})
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const tripData = {
                ...formData,
                requestSource: 'APP',
                userId: user.id || user._id // Include user ID for history tracking
            };

            await tripService.createTrip(tripData);
            setSuccess(true);
            // Reset form
            setFormData({
                customerName: '',
                customerPhone: '',
                pickupLocation: '',
                dropLocation: '',
                tripDateTime: '',
                vehicleCategory: '',
                vehicleSubcategory: ''
            });

            // Hide success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError('Failed to create trip request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSOS = async () => {
        if (!confirm('Are you sure you want to trigger an SOS alert? This will notify the admin immediately.')) return;

        setSosLoading(true);
        try {
            // Get current location if possible
            let location = { lat: 0, lng: 0 };
            if (navigator.geolocation) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                } catch (e) {
                    console.error('Location access denied or timeout', e);
                }
            }

            await sosService.createSOS({
                customerName: user?.username || formData.customerName || 'Unknown User',
                customerPhone: formData.customerPhone || 'Unknown Phone',
                userId: user?.id,
                location
            });
            alert('SOS Alert Sent! Help is on the way.');
        } catch (err) {
            console.error(err);
            alert('Failed to send SOS. Please call emergency services directly.');
        } finally {
            setSosLoading(false);
        }
    };

    const availableSubcategories = formData.vehicleCategory
        ? VEHICLE_CATEGORIES[formData.vehicleCategory]
        : [];

    return (
        <div className="trip-request-container">
            <div className="header">
                <div className="header-content">
                    <div>
                        <h1>Jubilant Setgo</h1>
                        <p>Request a Trip</p>
                        {user && <p className="user-greeting">Welcome, {user.username}!</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleSOS}
                            className="sos-button"
                            type="button"
                            disabled={sosLoading}
                            style={{ backgroundColor: '#EF4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            {sosLoading ? 'Sending...' : 'SOS'}
                        </button>
                        <button
                            onClick={logout}
                            className="logout-button"
                            type="button"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {success && (
                <div className="success-message">
                    ✓ Trip request submitted successfully!
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="trip-form">
                <div className="form-group">
                    <label htmlFor="customerName">Your Name *</label>
                    <input
                        type="text"
                        id="customerName"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleChange}
                        required
                        placeholder="Enter your name"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="customerPhone">Phone Number *</label>
                    <input
                        type="tel"
                        id="customerPhone"
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleChange}
                        required
                        pattern="[0-9]{10}"
                        maxLength="10"
                        placeholder="Enter 10-digit mobile number"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="pickupLocation">Pickup Location *</label>
                    <input
                        type="text"
                        id="pickupLocation"
                        name="pickupLocation"
                        value={formData.pickupLocation}
                        onChange={handleChange}
                        required
                        placeholder="Enter pickup location"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="dropLocation">Drop Location *</label>
                    <input
                        type="text"
                        id="dropLocation"
                        name="dropLocation"
                        value={formData.dropLocation}
                        onChange={handleChange}
                        required
                        placeholder="Enter drop location"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="tripDateTime">Date & Time *</label>
                    <input
                        type="datetime-local"
                        id="tripDateTime"
                        name="tripDateTime"
                        value={formData.tripDateTime}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="vehicleCategory">Vehicle Category *</label>
                    <select
                        id="vehicleCategory"
                        name="vehicleCategory"
                        value={formData.vehicleCategory}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select category</option>
                        {Object.keys(VEHICLE_CATEGORIES).map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>

                {formData.vehicleCategory && (
                    <div className="form-group">
                        <label htmlFor="vehicleSubcategory">Vehicle Type *</label>
                        <select
                            id="vehicleSubcategory"
                            name="vehicleSubcategory"
                            value={formData.vehicleSubcategory}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select type</option>
                            {availableSubcategories.map(subcategory => (
                                <option key={subcategory} value={subcategory}>
                                    {subcategory}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <button
                    type="submit"
                    className="submit-button"
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Request Trip'}
                </button>
            </form>
        </div>
    );
}

export default TripRequestForm;
