import React, { useState } from 'react';
import { X } from 'lucide-react';
import { tripService } from '../../services/api';

const AddDriverModal = ({ onClose, onDriverAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '12345', // Default password
        vehicleModel: '',
        vehicleNumber: '',
        vehicleCategory: 'Sedan Regular',
        status: 'OFFLINE',
        rating: 5.0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const vehicleCategories = [
        'Sedan Regular', 'Sedan Premium', 'Sedan Premium+',
        'SUV Regular', 'SUV Premium',
        'Tempo Traveller', 'Force Premium',
        'Bus', 'High-End Coach'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await tripService.createDriver(formData);
            onDriverAdded();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to add driver');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-900">Add New Driver</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Driver Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jubilant-500"
                                placeholder="e.g., John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                pattern="[0-9]{10}"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jubilant-500"
                                placeholder="e.g., 9876543210"
                            />
                            <p className="text-xs text-gray-500 mt-1">10-digit mobile number</p>
                        </div>


                        {/* Password is set to default '12345' automatically */}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Vehicle Model *
                            </label>
                            <input
                                type="text"
                                name="vehicleModel"
                                value={formData.vehicleModel}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jubilant-500"
                                placeholder="e.g., Swift, Innova"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Vehicle Number *
                            </label>
                            <input
                                type="text"
                                name="vehicleNumber"
                                value={formData.vehicleNumber}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jubilant-500"
                                placeholder="e.g., KA-01-AB-1234"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Vehicle Category *
                            </label>
                            <select
                                name="vehicleCategory"
                                value={formData.vehicleCategory}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jubilant-500"
                            >
                                {vehicleCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Initial Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jubilant-500"
                            >
                                <option value="OFFLINE">Offline</option>
                                <option value="ONLINE">Online</option>
                                <option value="BUSY">Busy</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
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
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            {loading ? 'Adding...' : 'Add Driver'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDriverModal;
