import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { tripService, sosService } from '../services/api';
import { VEHICLE_CATEGORIES } from '../config/vehicles';
import './TripRequestForm.css';

const PICKUP_TYPES = [
    { value: 'AIRPORT', label: 'Airport' },
    { value: 'RAILWAY_STATION', label: 'Railway Station' },
    { value: 'BUS_STAND', label: 'Bus Stand' },
    { value: 'OTHERS', label: 'Others' }
];

function TripRequestForm() {
    const { user, logout } = useAuth();
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        pickupType: 'OTHERS',
        pickupLocation: '',
        googleLocation: '',
        pickupContext: {
            flightNumber: '',
            trainNumber: '',
            busNumber: ''
        },
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

        // Context fields handling
        if (['flightNumber', 'trainNumber', 'busNumber'].includes(name)) {
            setFormData(prev => ({
                ...prev,
                pickupContext: {
                    ...prev.pickupContext,
                    [name]: value
                }
            }));
            return;
        }

        // Phone number validation: only allow numbers and max 10 digits
        if (name === 'customerPhone') {
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({
                ...prev,
                [name]: numericValue
            }));
            return;
        }

        // Pickup Type handling
        if (name === 'pickupType') {
            let newPickupLocation = '';
            if (value === 'AIRPORT') newPickupLocation = 'Airport';
            // Keep location empty/manual for others or let user type detailed station name

            setFormData(prev => ({
                ...prev,
                pickupType: value,
                pickupLocation: newPickupLocation,
                pickupContext: { // Reset context on type change
                    flightNumber: '',
                    trainNumber: '',
                    busNumber: ''
                }
            }));
            return;
        }

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

        // Validation
        if (!formData.customerName || !formData.customerPhone || !formData.tripDateTime) {
            setError('Please fill in all mandatory fields.');
            setLoading(false);
            return;
        }

        if (formData.customerPhone.length !== 10) {
            setError('Phone number must be exactly 10 digits.');
            setLoading(false);
            return;
        }

        // Flight/Train/Bus Mandatory Check
        if (formData.pickupType === 'AIRPORT' && !formData.pickupContext.flightNumber) {
            setError('Flight Number is mandatory for Airport pickups.');
            setLoading(false);
            return;
        }
        if (formData.pickupType === 'RAILWAY_STATION' && !formData.pickupContext.trainNumber) {
            setError('Train Number is mandatory for Railway Station pickups.');
            setLoading(false);
            return;
        }
        if (formData.pickupType === 'BUS_STAND' && !formData.pickupContext.busNumber) {
            setError('Bus Number is mandatory for Bus Stand pickups.');
            setLoading(false);
            return;
        }

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
                pickupType: 'OTHERS',
                pickupLocation: '',
                googleLocation: '',
                pickupContext: {
                    flightNumber: '',
                    trainNumber: '',
                    busNumber: ''
                },
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
            <h2 className="text-xl font-bold text-gray-800 mb-6">Request a Trip</h2>

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

                {/* Pickup Type Dropdown */}
                <div className="form-group">
                    <label htmlFor="pickupType">Pickup Type *</label>
                    <select
                        id="pickupType"
                        name="pickupType"
                        value={formData.pickupType}
                        onChange={handleChange}
                        required
                    >
                        {PICKUP_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Conditional Inputs based on Pickup Type */}
                {formData.pickupType === 'AIRPORT' && (
                    <div className="form-group">
                        <label htmlFor="flightNumber">Flight Number *</label>
                        <input
                            type="text"
                            id="flightNumber"
                            name="flightNumber"
                            value={formData.pickupContext.flightNumber}
                            onChange={handleChange}
                            required
                            placeholder="e.g., AI-101"
                        />
                    </div>
                )}

                {formData.pickupType === 'RAILWAY_STATION' && (
                    <div className="form-group">
                        <label htmlFor="trainNumber">Train Number *</label>
                        <input
                            type="text"
                            id="trainNumber"
                            name="trainNumber"
                            value={formData.pickupContext.trainNumber}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Shatabdi Express"
                        />
                    </div>
                )}

                {formData.pickupType === 'BUS_STAND' && (
                    <div className="form-group">
                        <label htmlFor="busNumber">Bus Number *</label>
                        <input
                            type="text"
                            id="busNumber"
                            name="busNumber"
                            value={formData.pickupContext.busNumber}
                            onChange={handleChange}
                            required
                            placeholder="e.g., KSRTC Volvo"
                        />
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="pickupLocation">Pickup Location *</label>
                    <input
                        type="text"
                        id="pickupLocation"
                        name="pickupLocation"
                        value={formData.pickupLocation}
                        onChange={handleChange}
                        required
                        placeholder={formData.pickupType === 'AIRPORT' ? 'Airport' : 'Enter specific location'}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="googleLocation">Google Maps Link (Optional)</label>
                    <input
                        type="text"
                        id="googleLocation"
                        name="googleLocation"
                        value={formData.googleLocation}
                        onChange={handleChange}
                        placeholder="Paste Google Maps URL"
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
