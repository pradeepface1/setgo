import React, { useState, useEffect } from 'react';
import { X, Truck, Banknote, User } from 'lucide-react';
import { tripService, organizationService, consignorService } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

const LogisticsTripForm = ({ onClose, onTripCreated }) => {
    const { currentVertical } = useSettings();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial State
    const [formData, setFormData] = useState({
        // Step 1: Route & Load
        consignorId: '',
        loadingLocation: '',
        unloadingLocation: '',
        expectedWeight: '',
        vehicleCategory: 'LCV',
        tripDateTime: new Date().toISOString().slice(0, 16),

        // Step 2: Financials
        ratePerTon: '',
        totalFreight: 0,
        commissionPercentage: 0,
        commissionAmount: 0,
        consignorAdvance: '',
        driverAdvance: '',
        paymentMode: 'CASH',

        // Step 3: Assignment (Optional initial assignment)
        assignedDriverId: ''
    });

    const [consignors, setConsignors] = useState([]);
    const [drivers, setDrivers] = useState([]);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [consignorData, driverData] = await Promise.all([
                    consignorService.getAll({ limit: 100 }), // Fetch active consignors
                    tripService.getDrivers({ vertical: 'LOGISTICS' }) // Fetch all drivers to allow smart assignment
                ]);
                setConsignors(consignorData.consignors || consignorData);
                setDrivers(driverData);
            } catch (err) {
                console.error("Failed to fetch form data", err);
                setError("Failed to load consignors or drivers");
            }
        };
        fetchData();
    }, []);

    // Calculations
    useEffect(() => {
        const weight = parseFloat(formData.expectedWeight) || 0;
        const rate = parseFloat(formData.ratePerTon) || 0;
        const freight = weight * rate;

        const commPct = parseFloat(formData.commissionPercentage) || 0;
        const commAmt = (freight * commPct) / 100;

        setFormData(prev => ({
            ...prev,
            totalFreight: freight,
            commissionAmount: commAmt
        }));
    }, [formData.expectedWeight, formData.ratePerTon, formData.commissionPercentage]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.assignedDriverId) {
            const selectedDriver = drivers.find(d => d._id === formData.assignedDriverId);
            if (selectedDriver && selectedDriver.status === 'OFFLINE') {
                const proceed = window.confirm(`Road Pilot ${selectedDriver.name} is currently OFFLINE. Do you want to force them ONLINE and assign this trip?`);
                if (!proceed) return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                vertical: 'LOGISTICS',
                status: formData.assignedDriverId ? 'ASSIGNED' : 'PENDING'
            };

            await tripService.createTrip(payload);
            onTripCreated();
            onClose();
        } catch (err) {
            setError(err.message || "Failed to create trip");
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <Truck className="h-5 w-5 mr-2" /> Route & Load
            </h4>

            <div>
                <label className="block text-sm font-medium text-gray-700">Consignor *</label>
                <select
                    name="consignorId"
                    value={formData.consignorId}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-jubilant-500 focus:border-jubilant-500"
                >
                    <option value="">Select Consignor</option>
                    {consignors.map(c => (
                        <option key={c._id} value={c._id}>{c.name} - {c.location}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Loading Location *</label>
                    <input
                        type="text"
                        name="loadingLocation"
                        value={formData.loadingLocation}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Unloading Location *</label>
                    <input
                        type="text"
                        name="unloadingLocation"
                        value={formData.unloadingLocation}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Weight (Tons) *</label>
                    <input
                        type="number"
                        name="expectedWeight"
                        value={formData.expectedWeight}
                        onChange={handleChange}
                        required
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Trip Date & Time</label>
                    <input
                        type="datetime-local"
                        name="tripDateTime"
                        value={formData.tripDateTime}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                <select
                    name="vehicleCategory"
                    value={formData.vehicleCategory}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                >
                    <option value="LCV">LCV (Tata Ace, Dost)</option>
                    <option value="MCV">MCV (Eicher, Tata 709)</option>
                    <option value="HCV">HCV (10 Tyres+)</option>
                    <option value="Container">Container</option>
                    <option value="Trailer">Trailer</option>
                </select>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <Banknote className="h-5 w-5 mr-2" /> Commercials
            </h4>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Rate Per Ton (₹) *</label>
                    <input
                        type="number"
                        name="ratePerTon"
                        value={formData.ratePerTon}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Total Freight (₹)</label>
                    <input
                        type="number"
                        value={formData.totalFreight}
                        readOnly
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Commission (%)</label>
                    <input
                        type="number"
                        name="commissionPercentage"
                        value={formData.commissionPercentage}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Commission Amount (₹)</label>
                    <input
                        type="number"
                        value={formData.commissionAmount}
                        readOnly
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Advance from Consignor (₹)</label>
                    <input
                        type="number"
                        name="consignorAdvance"
                        value={formData.consignorAdvance}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Advance to Driver (₹)</label>
                    <input
                        type="number"
                        name="driverAdvance"
                        value={formData.driverAdvance}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Payment Mode (from Consignor)</label>
                <select
                    name="paymentMode"
                    value={formData.paymentMode}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                >
                    <option value="CASH">Cash</option>
                    <option value="NEFT">NEFT/Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CREDIT">Credit</option>
                </select>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" /> Driver Assignment (Optional)
            </h4>

            <p className="text-sm text-gray-500">You can assign a driver now or later from the trip list.</p>

            <div>
                <label className="block text-sm font-medium text-gray-700">Select Road Pilot</label>
                <select
                    name="assignedDriverId"
                    value={formData.assignedDriverId}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                >
                    <option value="">Do not assign yet</option>
                    {drivers.map(d => (
                        <option key={d._id} value={d._id}>
                            {d.name} ({d.vehicleNumber || 'No Truck'}) - {d.status}
                        </option>
                    ))}
                </select>
            </div>

            {formData.assignedDriverId && drivers.find(d => d._id === formData.assignedDriverId)?.vehicleNumber && (
                <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
                    Selected Vehicle: {drivers.find(d => d._id === formData.assignedDriverId).vehicleNumber}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-900">Create Logistics Trip</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {/* Progress Bar */}
                    <div className="flex items-center justify-between mb-6 px-4">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`flex flex-col items-center ${step >= s ? 'text-jubilant-600' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= s ? 'border-jubilant-600 bg-jubilant-50' : 'border-gray-300'}`}>
                                    {s}
                                </div>
                                <span className="text-xs mt-1">
                                    {s === 1 ? 'Route' : s === 2 ? 'Finance' : 'Assign'}
                                </span>
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form id="logistics-form" onSubmit={handleSubmit}>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </form>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-between rounded-b-lg">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                            Back
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                    )}

                    {step < 3 ? (
                        <button
                            type="button"
                            onClick={() => setStep(step + 1)}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-jubilant-600 hover:bg-jubilant-700"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            type="submit"
                            form="logistics-form"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Trip'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogisticsTripForm;
