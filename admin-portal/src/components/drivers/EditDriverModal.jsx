import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { tripService, organizationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EditDriverModal = ({ driver, onClose, onDriverUpdated, vertical }) => {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState([]);

    const driverVertical = vertical || driver.vertical || 'TAXI';
    const isLogistics = driverVertical === 'LOGISTICS';

    const [formData, setFormData] = useState({
        name: driver.name || '',
        phone: driver.phone || '',
        vehicleModel: driver.vehicleModel || '',
        vehicleNumber: driver.vehicleNumber || '',
        vehicleCategory: driver.vehicleCategory || (isLogistics ? 'LCV' : 'Sedan Regular'),
        status: driver.status || 'OFFLINE',
        rating: driver.rating || 5.0,
        organizationId: driver.organizationId?._id || driver.organizationId || '',
        // Logistics / Road Pilot owner fields
        lorryName: driver.lorryName || '',
        ownerName: driver.ownerName || '',
        ownerPhone: driver.ownerPhone || '',
        ownerHometown: driver.ownerHometown || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const taxiVehicleCategories = [
        'Sedan Regular', 'Sedan Premium', 'Sedan Premium+',
        'SUV Regular', 'SUV Premium',
        'Tempo Traveller', 'Force Premium',
        'Bus', 'High-End Coach'
    ];

    const logisticsVehicleCategories = ['LCV', 'HCV', 'Trailer', 'Container', 'Tanker', 'Other'];

    const vehicleCategories = isLogistics ? logisticsVehicleCategories : taxiVehicleCategories;

    const vehicleModels = {
        'Sedan Regular': ['Swift Dzire', 'Etios', 'Aura'],
        'Sedan Premium': ['Benz E Class', 'BMW 5 Series', 'Audi A6'],
        'Sedan Premium+': ['Benz S Class', 'BMW 7 Series'],
        'SUV Regular': ['Innova Crysta', 'Ertiga'],
        'SUV Premium': ['Innova Hycross', 'Fortuner'],
        'Tempo Traveller': ['12 Seater Basic'],
        'Force Premium': ['Urbania 16 Seater'],
        'Bus': ['20 Seater', '25 Seater', '33 Seater', '40 Seater', '50 Seater'],
        'High-End Coach': ['Commuter', 'Vellfire', 'Benz Van']
    };

    useEffect(() => {
        const fetchOrgs = async () => {
            if (user?.role === 'SUPER_ADMIN') {
                try {
                    const orgs = await organizationService.getAll();
                    // Filter based on vertical if provided, else rely on driver's vertical or show all?
                    // Safe to filter by passed vertical if available.
                    const targetVertical = vertical || driver.vertical || 'TAXI';
                    const filteredOrgs = orgs.filter(org =>
                        org.verticals && org.verticals.includes(targetVertical)
                    );
                    setOrganizations(filteredOrgs);
                } catch (error) {
                    console.error('Failed to fetch orgs', error);
                }
            }
        };
        fetchOrgs();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'vehicleCategory') {
            setFormData(prev => ({
                ...prev,
                vehicleCategory: value,
                vehicleModel: vehicleModels[value]?.[0] || ''
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
            await tripService.updateDriver(driver._id, formData);
            onDriverUpdated();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to update driver');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-start justify-center pt-24 pb-12 z-50">
            <div className="relative w-full max-w-2xl mx-4 p-5 border shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Edit Driver</h3>
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Change Password</label>
                            <input
                                type="text"
                                name="password"
                                placeholder="Leave blank to keep current"
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Vehicle Category *</label>
                            <select
                                name="vehicleCategory"
                                value={formData.vehicleCategory}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            >
                                {vehicleCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Vehicle Model {!isLogistics && '*'}</label>
                            {isLogistics ? (
                                <input
                                    type="text"
                                    name="vehicleModel"
                                    value={formData.vehicleModel}
                                    onChange={handleChange}
                                    placeholder="e.g. Lorry name or model"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            ) : (
                                <select
                                    name="vehicleModel"
                                    value={formData.vehicleModel}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                >
                                    {vehicleModels[formData.vehicleCategory]?.map(model => (
                                        <option key={model} value={model}>{model}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Vehicle Number *</label>
                            <input
                                type="text"
                                name="vehicleNumber"
                                value={formData.vehicleNumber}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            >
                                <option value="ONLINE">Online</option>
                                <option value="OFFLINE">Offline</option>
                                <option value="BUSY">Busy</option>
                            </select>
                        </div>

                        {user?.role === 'SUPER_ADMIN' && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Organization</label>
                                <select
                                    name="organizationId"
                                    value={formData.organizationId}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                >
                                    <option value="">Select Organization</option>
                                    {organizations.map(org => (
                                        <option key={org._id} value={org._id}>
                                            {org.displayName || org.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Owner / Lorry details — Logistics only */}
                    {isLogistics && (
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold text-gray-600 mb-3">Owner &amp; Lorry Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Lorry Name</label>
                                    <input
                                        type="text"
                                        name="lorryName"
                                        value={formData.lorryName}
                                        onChange={handleChange}
                                        placeholder="e.g. N.S. KARUR ROADWAYS"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                                    <input
                                        type="text"
                                        name="ownerName"
                                        value={formData.ownerName}
                                        onChange={handleChange}
                                        placeholder="e.g. Murugavel"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Owner Phone</label>
                                    <input
                                        type="tel"
                                        name="ownerPhone"
                                        value={formData.ownerPhone}
                                        onChange={handleChange}
                                        placeholder="e.g. 9488915889"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Owner Hometown</label>
                                    <input
                                        type="text"
                                        name="ownerHometown"
                                        value={formData.ownerHometown}
                                        onChange={handleChange}
                                        placeholder="e.g. Sangagiri"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

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
                            {loading ? 'Updating...' : 'Update Driver'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDriverModal;
