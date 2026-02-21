import React, { useState } from 'react';
import { X } from 'lucide-react';
import { tripService, organizationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AddDriverModal = ({ onClose, onDriverAdded, vertical = 'TAXI' }) => {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '', // Default password
        vehicleModel: '',
        vehicleNumber: '',
        vehicleCategory: vertical === 'LOGISTICS' ? 'LCV' : 'Sedan Regular',
        status: 'OFFLINE',
        rating: 5.0,
        organizationId: '', // For Super Admin
        vertical: vertical,
        // Logistics Fields
        lorryName: '',
        ownerName: '',
        ownerPhone: '',
        ownerHometown: '',
        panNumber: '',
        accountName: '',
        bankName: '',
        upiNumber: '',
        accountNumber: '',
        ifsc: '',
        // Compliance
        fcStatus: '',
        insuranceExpiry: '',
        taxExpiry: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const taxiVehicleCategories = [
        'Sedan Regular', 'Sedan Premium', 'Sedan Premium+',
        'SUV Regular', 'SUV Premium',
        'Tempo Traveller', 'Force Premium',
        'Bus', 'High-End Coach'
    ];

    const logisticsVehicleCategories = [
        'LCV', 'MCV', 'HCV', 'Container', 'Trailer'
    ];

    const vehicleCategories = vertical === 'LOGISTICS' ? logisticsVehicleCategories : taxiVehicleCategories;

    const taxiVehicleModels = {
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

    const logisticsVehicleModels = {
        'LCV': ['Tata Ace', 'Bolero Pickup', 'Ashok Leyland Dost'],
        'MCV': ['Eicher Pro 2049', 'Tata 709', 'Eicher 19ft'],
        'HCV': ['Tata 1613', 'Eicher Pro 3015', 'Ashok Leyland Boss', '10 Wheeler', '12 Wheeler', '16 Wheeler'],
        'Container': ['32ft Single Axle', '32ft Multi Axle', '20ft Container'],
        'Trailer': ['Flat Bed 40ft', 'Low Bed', 'Semi Low Bed']
    };

    const vehicleModels = vertical === 'LOGISTICS' ? logisticsVehicleModels : taxiVehicleModels;

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'vehicleCategory') {
            setFormData(prev => ({
                ...prev,
                vehicleCategory: value,
                vehicleModel: vehicleModels[value]?.[0] || '' // Reset model when category changes
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Initialize vehicle model if empty
    React.useEffect(() => {
        if (!formData.vehicleModel && formData.vehicleCategory) {
            setFormData(prev => ({
                ...prev,
                vehicleModel: vehicleModels[formData.vehicleCategory]?.[0] || ''
            }));
        }

        const fetchOrgs = async () => {
            if (user?.role === 'SUPER_ADMIN') {
                try {
                    const orgs = await organizationService.getAll();
                    // Filter orgs based on vertical
                    const filteredOrgs = orgs.filter(org =>
                        org.verticals && org.verticals.includes(vertical)
                    );
                    setOrganizations(filteredOrgs);

                    // Default to first org if available
                    if (filteredOrgs.length > 0 && !formData.organizationId) {
                        setFormData(prev => ({ ...prev, organizationId: filteredOrgs[0]._id }));
                    }
                } catch (error) {
                    console.error('Failed to fetch orgs', error);
                }
            }
        };
        fetchOrgs();
    }, [user]); // Run on mount or user change

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Prepare payload
            const payload = { ...formData };

            // For Logistics, structure the bank details object and handle missing required fields for Taxi
            if (vertical === 'LOGISTICS') {
                payload.bankDetails = {
                    accountName: formData.accountName,
                    bankName: formData.bankName,
                    accountNumber: formData.accountNumber,
                    ifsc: formData.ifsc,
                    upiNumber: formData.upiNumber
                };

                // Add Compliance Dates
                if (formData.fcStatus) payload.fcStatus = formData.fcStatus;
                if (formData.insuranceExpiry) payload.insuranceExpiry = formData.insuranceExpiry;
                if (formData.taxExpiry) payload.taxExpiry = formData.taxExpiry;
                if (formData.taxExpiry) payload.taxExpiry = formData.taxExpiry;

                // Add Compliance Dates
                if (formData.fcStatus) payload.fcStatus = formData.fcStatus;
                if (formData.insuranceExpiry) payload.insuranceExpiry = formData.insuranceExpiry;
                if (formData.taxExpiry) payload.taxExpiry = formData.taxExpiry;

                // Set defaults for Taxi-required fields that are hidden
                payload.password = payload.password || 'LogisticsDefault123'; // Backend default
            }

            await tripService.createDriver(payload);
            onDriverAdded();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to add driver');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-start justify-center pt-24 pb-12 z-50">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-900">
                        {vertical === 'LOGISTICS' ? 'Add New Road Pilot' : 'Add New Driver'}
                    </h3>
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
                        {/* Common Fields - Organization */}
                        {user?.role === 'SUPER_ADMIN' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Organization *
                                </label>
                                <select
                                    name="organizationId"
                                    value={formData.organizationId}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jubilant-500"
                                >
                                    <option value="">Select Organization</option>
                                    {organizations.map(org => (
                                        <option key={org._id} value={org._id}>
                                            {org.displayName || org.name} ({org.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {vertical === 'LOGISTICS' ? 'Driver Name *' : 'Driver Name *'}
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
                                {vertical === 'LOGISTICS' ? 'Driver Mobile Number *' : 'Phone Number *'}
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
                            {vertical !== 'LOGISTICS' && <p className="text-xs text-gray-500 mt-1">10-digit mobile number</p>}
                        </div>

                        {/* Vehicle Number */}
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

                        {/* Password Field (Common for both) */}
                        {true && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete="new-password"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jubilant-500"
                                    placeholder="Enter password"
                                />
                            </div>
                        )}

                        {/* LOGISTICS Specific Fields */}
                        {vertical === 'LOGISTICS' && (
                            <>
                                <div className="border-t border-gray-200 pt-4 mt-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Owner Details (Optional)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Lorry Name</label>
                                            <input type="text" name="lorryName" value={formData.lorryName} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jubilant-500" placeholder="e.g., N.S. KARUR ROADWAYS" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                                            <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jubilant-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Mobile</label>
                                            <input type="text" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Hometown</label>
                                            <input type="text" name="ownerHometown" value={formData.ownerHometown} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                                            <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 uppercase" />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-4 mt-2">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Bank Details (Optional)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                                            <input type="text" name="accountName" value={formData.accountName} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                            <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                            <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                                            <input type="text" name="ifsc" value={formData.ifsc} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 uppercase" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">UPI Number</label>
                                            <input type="text" name="upiNumber" value={formData.upiNumber} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-4 mt-2">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Vehicle Documents (Expiry)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">FC Expiry</label>
                                            <input type="date" name="fcStatus" value={formData.fcStatus} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry</label>
                                            <input type="date" name="insuranceExpiry" value={formData.insuranceExpiry} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Expiry</label>
                                            <input type="date" name="taxExpiry" value={formData.taxExpiry} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Vehicle Category/Model */}
                        <div className="mt-4">
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
                                Vehicle Model *
                            </label>
                            <select
                                name="vehicleModel"
                                value={formData.vehicleModel}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jubilant-500"
                            >
                                {vehicleModels[formData.vehicleCategory]?.map(model => (
                                    <option key={model} value={model}>{model}</option>
                                )) || <option value="">Select Category First</option>}
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
                            {loading ? 'Adding...' : (vertical === 'LOGISTICS' ? 'Add Road Pilot' : 'Add Driver')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDriverModal;
