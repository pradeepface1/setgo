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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999]" onClick={onClose}>
            <div className="relative top-10 mx-auto rounded-3xl shadow-2xl w-full max-w-3xl border transition-colors duration-500 overflow-hidden"
                style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--theme-text-main)' }}>Edit Trip</h3>
                    <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-text-main)' }}>
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <p className="text-sm font-medium text-red-500">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Customer Details */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Customer Name *</label>
                                <input
                                    type="text"
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Customer Phone *</label>
                                <input
                                    type="tel"
                                    name="customerPhone"
                                    value={formData.customerPhone}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                />
                            </div>

                            {/* Pickup Details */}
                            <div className="col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Pickup Location *</label>
                                <input
                                    type="text"
                                    name="pickupLocation"
                                    value={formData.pickupLocation}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Pickup Type</label>
                                <select
                                    name="pickupType"
                                    value={formData.pickupType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none appearance-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                >
                                    {pickupTypes.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.pickupType === 'AIRPORT' && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Flight Number</label>
                                    <input
                                        type="text"
                                        name="pickupContext.flightNumber"
                                        value={formData.pickupContext.flightNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-card)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            color: 'var(--theme-text-main)'
                                        }}
                                    />
                                </div>
                            )}

                            {formData.pickupType === 'RAILWAY_STATION' && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Train Number</label>
                                    <input
                                        type="text"
                                        name="pickupContext.trainNumber"
                                        value={formData.pickupContext.trainNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-card)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            color: 'var(--theme-text-main)'
                                        }}
                                    />
                                </div>
                            )}

                            {formData.pickupType === 'BUS_STAND' && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Bus Number</label>
                                    <input
                                        type="text"
                                        name="pickupContext.busNumber"
                                        value={formData.pickupContext.busNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-card)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            color: 'var(--theme-text-main)'
                                        }}
                                    />
                                </div>
                            )}

                            {/* Drop Location */}
                            <div className="col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Drop Location *</label>
                                <input
                                    type="text"
                                    name="dropLocation"
                                    value={formData.dropLocation}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                />
                            </div>

                            {/* Trip Date & Time */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Trip Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    name="tripDateTime"
                                    value={formData.tripDateTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                />
                            </div>

                            {/* Vehicle Category */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Vehicle Category *</label>
                                <select
                                    name="vehicleCategory"
                                    value={formData.vehicleCategory}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none appearance-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                >
                                    <option value="">Select Category</option>
                                    {vehicleCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Vehicle Subcategory */}
                            <div className="col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Vehicle Subcategory (Optional)</label>
                                <input
                                    type="text"
                                    name="vehicleSubcategory"
                                    value={formData.vehicleSubcategory}
                                    onChange={handleChange}
                                    placeholder="e.g., AC, Non-AC"
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-8">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 border rounded-xl text-sm font-bold transition-all hover:bg-white/5 active:scale-95"
                                style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-8 py-2 rounded-xl shadow-lg text-sm font-bold transition-all active:scale-95 hover:shadow-[0_0_20px_var(--theme-primary-glow)]`}
                                style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}
                            >
                                {loading ? 'Updating...' : 'Update Trip'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditTripModal;
