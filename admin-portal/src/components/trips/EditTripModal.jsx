import React, { useState } from 'react';
import { X } from 'lucide-react';
import { tripService } from '../../services/api';

const EditTripModal = ({ trip, onClose, onTripUpdated }) => {
    const [formData, setFormData] = useState({
        customerName: trip.customerName || '',
        customerPhone: trip.customerPhone || trip.customerContact || '',
        pickupLocation: trip.pickupLocation || '',
        dropLocation: trip.dropLocation || '',
        tripDateTime: trip.tripDateTime ? new Date(trip.tripDateTime).toISOString().slice(0, 16) : '',
        vehicleCategory: trip.vehicleCategory || trip.vehiclePreference || '',
        vehicleSubcategory: trip.vehicleSubcategory || '',
        pickupType: trip.pickupType || 'OTHERS',
        pickupContext: {
            flightNumber: trip.pickupContext?.flightNumber || '',
            trainNumber: trip.pickupContext?.trainNumber || '',
            busNumber: trip.pickupContext?.busNumber || ''
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const vehicleCategories = [
        'Sedan Regular', 'Sedan Premium', 'Sedan Premium+',
        'SUV Regular', 'SUV Premium',
        'Tempo Traveller', 'Force Premium',
        'Bus', 'High End Coaches'
    ];

    const pickupTypes = [
        { value: 'AIRPORT', label: 'Airport' },
        { value: 'RAILWAY_STATION', label: 'Railway Station' },
        { value: 'BUS_STAND', label: 'Bus Stand' },
        { value: 'OTHERS', label: 'Others' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('pickupContext.')) {
            const contextField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                pickupContext: {
                    ...prev.pickupContext,
                    [contextField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Convert datetime back to ISO format
            const updateData = {
                ...formData,
                tripDateTime: new Date(formData.tripDateTime).toISOString(),
                customerContact: formData.customerPhone // Backend uses customerContact
            };

            await tripService.updateTrip(trip._id, updateData);
            onTripUpdated();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to update trip');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Edit Trip</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Customer Details */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
                            <input
                                type="text"
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Customer Phone *</label>
                            <input
                                type="tel"
                                name="customerPhone"
                                value={formData.customerPhone}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>

                        {/* Pickup Details */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Pickup Location *</label>
                            <input
                                type="text"
                                name="pickupLocation"
                                value={formData.pickupLocation}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Pickup Type</label>
                            <select
                                name="pickupType"
                                value={formData.pickupType}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            >
                                {pickupTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        {formData.pickupType === 'AIRPORT' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Flight Number</label>
                                <input
                                    type="text"
                                    name="pickupContext.flightNumber"
                                    value={formData.pickupContext.flightNumber}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                        )}

                        {formData.pickupType === 'RAILWAY_STATION' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Train Number</label>
                                <input
                                    type="text"
                                    name="pickupContext.trainNumber"
                                    value={formData.pickupContext.trainNumber}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                        )}

                        {formData.pickupType === 'BUS_STAND' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Bus Number</label>
                                <input
                                    type="text"
                                    name="pickupContext.busNumber"
                                    value={formData.pickupContext.busNumber}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                        )}

                        {/* Drop Location */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Drop Location *</label>
                            <input
                                type="text"
                                name="dropLocation"
                                value={formData.dropLocation}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>

                        {/* Trip Date & Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Trip Date & Time *</label>
                            <input
                                type="datetime-local"
                                name="tripDateTime"
                                value={formData.tripDateTime}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>

                        {/* Vehicle Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Vehicle Category *</label>
                            <select
                                name="vehicleCategory"
                                value={formData.vehicleCategory}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            >
                                <option value="">Select Category</option>
                                {vehicleCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Vehicle Subcategory */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Vehicle Subcategory (Optional)</label>
                            <input
                                type="text"
                                name="vehicleSubcategory"
                                value={formData.vehicleSubcategory}
                                onChange={handleChange}
                                placeholder="e.g., AC, Non-AC"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Trip'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTripModal;
