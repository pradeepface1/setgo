import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { tripService, organizationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EditDriverModal = ({ driver, onClose, onDriverUpdated, vertical }) => {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState([]);

    const driverVertical = vertical || driver.vertical || 'TAXI';
    const isLogistics = driverVertical === 'LOGISTICS';

    const taxiVehicleCategories = [
        'Sedan Regular', 'Sedan Premium', 'Sedan Premium+',
        'SUV Regular', 'SUV Premium',
        'Tempo Traveller', 'Force Premium',
        'Bus', 'High-End Coach', 'Others'
    ];
    const logisticsVehicleCategories = [
        '10 wheeler', '12 wheeler', '14 wheeler', '16 wheeler', '20ft Container', '32ft Container', 'Others'
    ];
    const vehicleCategories = isLogistics ? logisticsVehicleCategories : taxiVehicleCategories;

    const initialCategory = driver.vehicleCategory || (isLogistics ? '10 wheeler' : 'Sedan Regular');
    const isCustomCat = !vehicleCategories.includes(initialCategory) && initialCategory;

    const [customCategory, setCustomCategory] = useState(isCustomCat ? initialCategory : '');

    const [formData, setFormData] = useState({
        name: driver.name || '',
        phone: driver.phone || '',
        vehicleModel: driver.vehicleModel || '',
        vehicleNumber: driver.vehicleNumber || '',
        vehicleCategory: isCustomCat ? 'Others' : initialCategory,
        status: driver.status || 'OFFLINE',
        rating: driver.rating || 5.0,
        organizationId: driver.organizationId?._id || driver.organizationId || '',
        // Logistics / Road Pilot owner fields
        lorryName: driver.lorryName || '',
        ownerName: driver.ownerName || '',
        ownerPhone: driver.ownerPhone || '',
        ownerHometown: driver.ownerHometown || '',
        panNumber: driver.panNumber || '',
        panCardName: driver.panCardName || '',
        accountName: driver.bankDetails?.accountName || '',
        bankName: driver.bankDetails?.bankName || '',
        accountNumber: driver.bankDetails?.accountNumber || '',
        ifsc: driver.bankDetails?.ifsc || '',
        upiNumber: driver.bankDetails?.upiNumber || '',
        secondaryAccountName: driver.secondaryBankDetails?.accountName || '',
        secondaryBankName: driver.secondaryBankDetails?.bankName || '',
        secondaryAccountNumber: driver.secondaryBankDetails?.accountNumber || '',
        secondaryIfsc: driver.secondaryBankDetails?.ifsc || '',
        secondaryUpiNumber: driver.secondaryBankDetails?.upiNumber || '',
        dtsDocument: null // File tracking
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
            return;
        }

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
            const payload = { ...formData };
            if (payload.vehicleCategory === 'Others') {
                payload.vehicleCategory = customCategory || 'Others';
                payload.vehicleModel = ''; // Nullify model if using Others
            }

            if (isLogistics) {
                payload.bankDetails = {
                    accountName: formData.accountName,
                    bankName: formData.bankName,
                    accountNumber: formData.accountNumber,
                    ifsc: formData.ifsc,
                    upiNumber: formData.upiNumber
                };

                payload.secondaryBankDetails = {
                    accountName: formData.secondaryAccountName,
                    bankName: formData.secondaryBankName,
                    accountNumber: formData.secondaryAccountNumber,
                    ifsc: formData.secondaryIfsc,
                    upiNumber: formData.secondaryUpiNumber
                };

                delete payload.accountName;
                delete payload.bankName;
                delete payload.accountNumber;
                delete payload.ifsc;
                delete payload.upiNumber;
                delete payload.secondaryAccountName;
                delete payload.secondaryBankName;
                delete payload.secondaryAccountNumber;
                delete payload.secondaryIfsc;
                delete payload.secondaryUpiNumber;

                if (formData.dtsDocument instanceof File) {
                    payload.dtsDocument = `https://storage.googleapis.com/setgo-dts/${formData.dtsDocument.name}`;
                } else {
                    delete payload.dtsDocument; // Keep existing if not newly uploaded
                }
            }

            await tripService.updateDriver(driver._id, payload);
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
            <div className="relative theme-modal w-full max-w-2xl mx-4 p-5 border shadow-lg rounded-md">
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

                        {formData.vehicleCategory === 'Others' && (
                            <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Custom Category Name *
                                </label>
                                <input
                                    type="text"
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    placeholder="e.g., Tractor Trailer"
                                />
                            </div>
                        )}

                        {formData.vehicleCategory !== 'Others' && !isLogistics && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Vehicle Model *</label>
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
                            </div>
                        )}

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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">PAN Number</label>
                                    <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 uppercase" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">PAN Card Holder Name</label>
                                    <input type="text" name="panCardName" value={formData.panCardName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 uppercase" />
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-600 mb-3">DTS Document Upload</h4>
                                <div className="flex flex-col gap-2">
                                    <label className="block text-sm font-medium text-gray-700">Update DTS Document (Image/PDF)</label>
                                    {driver.dtsDocument && <a href={driver.dtsDocument} target="_blank" rel="noreferrer" className="text-xs text-blue-600">View Current DTS Document</a>}
                                    <input
                                        type="file"
                                        name="dtsDocument"
                                        accept="image/*,.pdf"
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-jubilant-50 file:text-jubilant-700 hover:file:bg-jubilant-100"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-600 mb-3">Primary Bank Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Account Name</label>
                                        <input type="text" name="accountName" value={formData.accountName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                        <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Account Number</label>
                                        <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                                        <input type="text" name="ifsc" value={formData.ifsc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 uppercase" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">UPI Number</label>
                                        <input type="text" name="upiNumber" value={formData.upiNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-600 mb-3">Secondary Bank Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Account Name</label>
                                        <input type="text" name="secondaryAccountName" value={formData.secondaryAccountName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                        <input type="text" name="secondaryBankName" value={formData.secondaryBankName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Account Number</label>
                                        <input type="text" name="secondaryAccountNumber" value={formData.secondaryAccountNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                                        <input type="text" name="secondaryIfsc" value={formData.secondaryIfsc} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 uppercase" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">UPI Number</label>
                                        <input type="text" name="secondaryUpiNumber" value={formData.secondaryUpiNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
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
            </div >
        </div >
    );
};

export default EditDriverModal;
