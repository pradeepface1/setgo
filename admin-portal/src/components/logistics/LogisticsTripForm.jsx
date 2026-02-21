import React, { useState, useEffect, useRef } from 'react';
import { X, Truck, Banknote, User, FileText, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { tripService, organizationService, consignorService } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { generateHireSlip } from '../../utils/generateHireSlip';
import { generateConsignorSlip } from '../../utils/generateConsignorSlip';
import { useAuth } from '../../context/AuthContext';

const LogisticsTripForm = ({ trip, onSave, onCancel }) => {
    const { preferences } = useAuth();
    const [formData, setFormData] = useState({
        tripDate: new Date().toISOString().split('T')[0],
        lorryNumber: '',
        route: { from: '', to: '' },
        consignor: { name: '' },
        marketVehicle: {
            lorryName: '',
            ownerName: '',
            ownerPhone: '',
            driverName: '',
            driverPhone: '',
            panNumber: '',
            bankDetails: {
                accountName: '',
                bankName: '',
                accountNumber: '',
                ifsc: ''
            }
        },
        consignmentItem: '',
        weight: { loaded: 0, unloaded: 0 },
        costing: {
            ratePerTon: 0,
            hireValue: 0,
            loadingCharge: 0,
            unloadingCharge: 0,
            commission: 0,
            advance: 0,
            loadingCommission: 0,
            otherExpenses: 0, // New field
            paymentAccount: '' // Add payment account field
        },
        billing: {
            ratePerTon: 0,
            grossAmount: 0,
            loadingMamul: 0,
            paymentAccount: '' // Add payment account field
        },
        assignedDriverId: null, // Store selected driver ID
        status: 'PENDING', // Default status
        loadingDate: new Date().toISOString().split('T')[0]
    });

    // Autocomplete State
    const [suggestions, setSuggestions] = useState([]);
    const [consignorSuggestions, setConsignorSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showConsignorSuggestions, setShowConsignorSuggestions] = useState(false);
    const suggestionRef = useRef(null);
    const consignorRef = useRef(null);

    useEffect(() => {
        if (trip) {
            setFormData({
                ...trip,
                // Use tripDateTime if tripDate is not present (standardizing on tripDateTime from backend)
                tripDate: trip.tripDateTime ? new Date(trip.tripDateTime).toISOString().split('T')[0] : (trip.tripDate ? trip.tripDate.split('T')[0] : ''),
                loadingDate: trip.loadingDate ? new Date(trip.loadingDate).toISOString().split('T')[0] : (trip.tripDateTime ? new Date(trip.tripDateTime).toISOString().split('T')[0] : ''),

                // Populate Nested Objects from Flat Trip Structure
                costing: {
                    ratePerTon: trip.driverRatePerTon || 0,
                    hireValue: trip.driverTotalPayable || 0,
                    loadingCharge: trip.loadingCharge || 0,
                    unloadingCharge: trip.unloadingCharge || 0,
                    commission: trip.commissionAmount || 0,
                    advance: trip.driverAdvance || 0,
                    paymentMode: trip.driverAdvancePaymentMode || 'CASH',
                    paymentAccount: trip.driverPaymentAccount || '',
                    loadingCommission: trip.driverLoadingCommission || 0,
                    otherExpenses: trip.driverOtherExpenses || 0
                },
                billing: {
                    ratePerTon: trip.ratePerTon || 0, // Fallback if exists
                    grossAmount: trip.totalFreight || 0,
                    loadingMamul: trip.loadingMamul || 0,
                    advance: trip.consignorAdvance || 0,
                    paymentMode: trip.consignorAdvancePaymentMode || 'CASH',
                    paymentAccount: trip.consignorPaymentAccount || ''
                },
                weight: {
                    loaded: trip.actualWeight || 0,
                    unloaded: 0
                },
                route: {
                    from: trip.loadingLocation || '',
                    to: trip.unloadingLocation || ''
                },
                consignor: {
                    name: trip.consignorId?.name || trip.consignorName || '',
                    _id: trip.consignorId?._id || trip.consignorId
                },
                consignmentItem: trip.consignmentItem || '', // Initialize here
                status: trip.status || 'PENDING' // Populate status
            });

            // Handle Consignor Name if populated object (Update name ensuring it's not overwritten)
            if (trip.consignorId && typeof trip.consignorId === 'object') {
                setFormData(prev => ({
                    ...prev,
                    consignor: {
                        name: trip.consignorId.name,
                        _id: trip.consignorId._id
                    }
                }));
            }

            // Handle Assigned Driver/Lorry Population
            if (trip.assignedDriver && typeof trip.assignedDriver === 'object') {
                const driver = trip.assignedDriver;
                setFormData(prev => ({
                    ...prev,
                    lorryNumber: driver.vehicleNumber,
                    assignedDriverId: driver._id,
                    marketVehicle: {
                        lorryName: driver.lorryName || trip.lorryName || driver.vehicleNumber,
                        ownerName: driver.ownerName || driver.name,
                        ownerPhone: driver.ownerPhone || driver.phone,
                        driverName: driver.name,
                        driverPhone: driver.phone,
                        panNumber: driver.panNumber || '',
                        bankDetails: {
                            accountName: driver.bankDetails?.accountName || '',
                            bankName: driver.bankDetails?.bankName || '',
                            accountNumber: driver.bankDetails?.accountNumber || '',
                            ifsc: driver.bankDetails?.ifscCode || ''
                        }
                    }
                }));
            } else if (trip.vehicleNumber) {
                // Fallback to ad-hoc details
                setFormData(prev => ({
                    ...prev,
                    lorryNumber: trip.vehicleNumber,
                    marketVehicle: {
                        ...prev.marketVehicle,
                        lorryName: trip.lorryName || trip.vehicleNumber || '',
                        driverName: trip.driverName || '',
                        driverPhone: trip.driverPhone || ''
                    }
                }));
            }
        } else {
            // Reset to Initial State
            setFormData({
                tripDate: new Date().toISOString().split('T')[0],
                lorryNumber: '',
                route: { from: '', to: '' },
                consignor: { name: '' },
                marketVehicle: {
                    lorryName: '',
                    ownerName: '',
                    ownerPhone: '',
                    driverName: '',
                    driverPhone: '',
                    panNumber: '',
                    bankDetails: {
                        accountName: '',
                        bankName: '',
                        accountNumber: '',
                        ifsc: ''
                    }
                },
                consignmentItem: '',
                weight: { loaded: 0, unloaded: 0 },
                costing: {
                    ratePerTon: 0,
                    hireValue: 0,
                    loadingCharge: 0,
                    unloadingCharge: 0,
                    commission: 0,
                    advance: 0,
                    loadingCommission: 0,
                    otherExpenses: 0
                },
                billing: {
                    ratePerTon: 0,
                    grossAmount: 0,
                    loadingMamul: 0,
                    advance: 0,
                    paymentMode: 'CASH'
                },
                assignedDriverId: null,
                status: 'PENDING'
            });
        }
    }, [trip]);

    // Auto-calculate Commission
    useEffect(() => {
        const grossAmount = parseFloat(formData.billing.grossAmount) || 0;
        const hireValue = parseFloat(formData.costing.hireValue) || 0;
        const loadingCommission = parseFloat(formData.costing.loadingCommission) || 0;

        // Net Hire Value = Hire Value - Loading Commission deduction
        const netHireValue = hireValue - loadingCommission;

        // Commission = Gross Amount - Net Hire Value
        const commission = grossAmount - netHireValue;

        setFormData(prev => ({
            ...prev,
            costing: {
                ...prev.costing,
                commission: commission > 0 ? commission : 0
            }
        }));
    }, [formData.billing.grossAmount, formData.costing.hireValue, formData.costing.loadingCommission]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
            if (consignorRef.current && !consignorRef.current.contains(event.target)) {
                setShowConsignorSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (section, field, value) => {
        setFormData(prev => {
            if (section) {
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [field]: value
                    }
                };
            }
            return { ...prev, [field]: value };
        });

        // Trigger autocomplete for Lorry Number
        if (!section && field === 'lorryNumber') {
            if (!value) {
                // Clear market vehicle details if lorry number is cleared
                setFormData(prev => ({
                    ...prev,
                    marketVehicle: {
                        lorryName: '',
                        ownerName: '',
                        ownerPhone: '',
                        driverName: '',
                        driverPhone: '',
                        panNumber: '',
                        bankDetails: {
                            accountName: '',
                            bankName: '',
                            accountNumber: '',
                            ifsc: ''
                        }
                    }
                }));
            }
            fetchSuggestions(value);
        }

        // Trigger autocomplete for Consignor
        if (section === 'consignor' && field === 'name') {
            fetchConsignorSuggestions(value);
        }
    };

    const fetchSuggestions = async (query) => {
        if (query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            // Search specifically for LOGISTICS vehicles
            const response = await tripService.getDrivers({
                search: query,
                vertical: 'LOGISTICS',
                limit: 5
            });

            const drivers = response.drivers || response;

            if (Array.isArray(drivers)) {
                setSuggestions(drivers);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error("Error fetching vehicle suggestions:", error);
        }
    };

    const selectVehicle = (driver) => {
        setFormData(prev => ({
            ...prev,
            lorryNumber: driver.vehicleNumber,
            marketVehicle: {
                lorryName: driver.lorryName || driver.vehicleNumber,
                ownerName: driver.ownerName || driver.name,
                ownerPhone: driver.ownerPhone || driver.phone,
                driverName: driver.name,
                driverPhone: driver.phone,
                panNumber: driver.panNumber || '',
                bankDetails: {
                    accountName: driver.bankDetails?.accountName || '',
                    bankName: driver.bankDetails?.bankName || '',
                    accountNumber: driver.bankDetails?.accountNumber || '',
                    ifsc: driver.bankDetails?.ifscCode || ''
                }
            },
            assignedDriverId: driver._id
        }));
        setShowSuggestions(false);
    };

    const fetchConsignorSuggestions = async (query) => {
        if (!query || query.length < 2) {
            setConsignorSuggestions([]);
            setShowConsignorSuggestions(false);
            return;
        }

        try {
            const response = await consignorService.getAll({
                search: query,
                limit: 5
            });
            const consignors = response.consignors || response;
            if (Array.isArray(consignors)) {
                setConsignorSuggestions(consignors);
                setShowConsignorSuggestions(true);
            }
        } catch (error) {
            console.error("Error fetching consignor suggestions:", error);
        }
    };

    const selectConsignor = (consignor) => {
        setFormData(prev => ({
            ...prev,
            consignor: {
                ...prev.consignor,
                name: consignor.name,
                _id: consignor._id
            }
        }));
        setShowConsignorSuggestions(false);
    };

    const handleNestedChange = (section, subsection, field, value) => {
        setFormData(prev => {
            if (subsection) {
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [subsection]: {
                            ...prev[section][subsection],
                            [field]: value
                        }
                    }
                };
            } else {
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [field]: value
                    }
                };
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const loadingCommission = parseFloat(formData.costing.loadingCommission) || 0;
        const totalHire = parseFloat(formData.costing.hireValue) || 0;
        const advance = parseFloat(formData.costing.advance) || 0;

        // Determine Final Status
        let finalStatus = formData.status || 'PENDING';
        if (finalStatus === 'PENDING' && (formData.assignedDriverId || formData.lorryNumber || formData.marketVehicle?.lorryName)) {
            finalStatus = 'ASSIGNED';
        }

        // Transform data to match Backend Trip Model
        const payload = {
            ...formData,
            // 1. Map Date
            tripDateTime: new Date(formData.tripDate),
            loadingDate: formData.loadingDate ? new Date(formData.loadingDate) : undefined,

            // Ad-hoc Vehicle Details (NEW)
            vehicleNumber: formData.lorryNumber,
            lorryName: formData.marketVehicle.lorryName,
            driverName: formData.marketVehicle.driverName,
            driverPhone: formData.marketVehicle.driverPhone,
            ownerName: formData.marketVehicle.ownerName,
            ownerPhone: formData.marketVehicle.ownerPhone,

            // Consignment Item (NEW)
            consignmentItem: formData.consignmentItem,

            // 5. Driver Financials
            driverRatePerTon: formData.costing.ratePerTon,
            driverTotalPayable: formData.costing.hireValue, // Save Total Hire Value
            driverLoadingCommission: loadingCommission, // NEW FIELD
            driverAdvance: formData.costing.advance,
            driverAdvancePaymentMode: formData.costing.paymentMode,
            driverPaymentAccount: formData.costing.paymentAccount, // NEW
            balancePayableToDriver: totalHire - advance - loadingCommission - (parseFloat(formData.costing.otherExpenses) || 0), // Deduct expenses from balance
            loadingCharge: formData.costing.loadingCharge,
            unloadingCharge: formData.costing.unloadingCharge,
            commissionAmount: formData.costing.commission,
            driverOtherExpenses: formData.costing.otherExpenses,

            // 6. Consignor Financials
            consignorAdvance: formData.billing.advance,
            consignorAdvancePaymentMode: formData.billing.paymentMode,
            consignorPaymentAccount: formData.billing.paymentAccount, // NEW
            balanceReceivable: formData.billing.grossAmount - formData.billing.advance,
            loadingMamul: formData.billing.loadingMamul,

            // 2. Map Consignor
            consignorId: formData.consignor._id ? formData.consignor._id : undefined,
            consignorName: formData.consignor.name, // Send name for free text support

            // 3. Map Route to Location
            loadingLocation: formData.route.from,
            unloadingLocation: formData.route.to,
            actualWeight: formData.weight.loaded, // Save Loaded Weight

            // 4. Map Driver
            assignedDriver: formData.assignedDriverId,
            status: finalStatus,

            // 5. Map Financials (Basic mapping, can be expanded)
            totalFreight: formData.billing.grossAmount,
            ratePerTon: formData.billing.ratePerTon,
        };

        if (payload.consignorName && payload.loadingLocation && payload.unloadingLocation) {
            // If no ID but name exists, we still proceed (one-off consignor)
            onSave(payload);
        } else {
            alert("Please ensure Consignor and Route (From/To) are filled.");
        }
    };

    // Auto-calculate Hire Value
    useEffect(() => {
        const loadedWeight = parseFloat(formData.weight.loaded) || 0;
        const ratePerTon = parseFloat(formData.costing.ratePerTon) || 0;
        const hireValue = loadedWeight * ratePerTon;

        setFormData(prev => {
            if (prev.costing.hireValue !== hireValue) {
                return {
                    ...prev,
                    costing: {
                        ...prev.costing,
                        hireValue: hireValue
                    }
                };
            }
            return prev;
        });
    }, [formData.weight.loaded, formData.costing.ratePerTon]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            {/* ... */}
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Section 1: Trip Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.tripDate}
                            onChange={(e) => handleChange(null, 'tripDate', e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Lorry Name *</label>
                        <input
                            type="text"
                            placeholder="e.g. N.S. KARUR ROADWAYS"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.marketVehicle.lorryName}
                            onChange={(e) => handleChange('marketVehicle', 'lorryName', e.target.value)}
                            required
                        />
                    </div>
                    {/* RESTORED LORRY NUMBER */}
                    <div className="relative" ref={suggestionRef}>
                        <label className="block text-sm font-medium text-gray-700">Lorry Number</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={formData.lorryNumber}
                                onChange={(e) => handleChange(null, 'lorryNumber', e.target.value)}
                                autoComplete="off" // Disable browser autocomplete
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                                    {suggestions.map(driver => (
                                        <li
                                            key={driver._id}
                                            onClick={() => selectVehicle(driver)}
                                            className="px-4 py-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center group"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 group-hover:text-indigo-700">
                                                    {driver.vehicleNumber}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {driver.name} • {driver.ownerName || 'Own'}
                                                </span>
                                            </div>
                                            <Truck className="h-4 w-4 text-gray-400 group-hover:text-indigo-500" />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                        <input
                            type="text"
                            placeholder="Owner Name"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.marketVehicle.ownerName}
                            onChange={(e) => handleChange('marketVehicle', 'ownerName', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Owner Phone</label>
                        <input
                            type="text"
                            placeholder="Owner Phone"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={formData.marketVehicle.ownerPhone}
                            onChange={(e) => handleChange('marketVehicle', 'ownerPhone', e.target.value)}
                        />
                    </div>
                    <div className="relative" ref={consignorRef}>
                        <label className="block text-sm font-medium text-gray-700">Consignor Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={formData.consignor.name}
                                onChange={(e) => handleChange('consignor', 'name', e.target.value)}
                                required
                                autoComplete="off"
                            />
                            {showConsignorSuggestions && consignorSuggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                                    {consignorSuggestions.map(consignor => (
                                        <li
                                            key={consignor._id}
                                            onClick={() => selectConsignor(consignor)}
                                            className="px-4 py-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center group"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 group-hover:text-indigo-700">
                                                    {consignor.name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {consignor.address || ''}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 2: Route */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">From</label>
                        <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.route.from} onChange={(e) => handleChange('route', 'from', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">To</label>
                        <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.route.to} onChange={(e) => handleChange('route', 'to', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Loading Date *</label>
                        <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.loadingDate} onChange={(e) => handleChange(null, 'loadingDate', e.target.value)} required />
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-4"></div>

                {/* Section 3: Loading Details */}
                <h3 className="text-lg font-semibold text-gray-700">Loading Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Consignment Item</label>
                        <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.consignmentItem} onChange={(e) => handleChange(null, 'consignmentItem', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Loaded Weight (Tons)</label>
                        <input type="number" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.weight.loaded} onChange={(e) => handleChange('weight', 'loaded', e.target.value)} />
                    </div>
                </div>

                {/* Section 4: Costing (Payable to Lorry) */}
                <div className="bg-red-50 p-4 rounded-md mt-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Costing (Payable to Lorry)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Rate Per Ton</label>
                            <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={formData.costing.ratePerTon} onChange={(e) => handleChange('costing', 'ratePerTon', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hire Value (Auto-calculated)</label>
                            <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                                value={formData.costing.hireValue} readOnly />
                            <p className="text-xs text-gray-500 mt-1">Weight * Rate</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Loading Charge</label>
                            <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={formData.costing.loadingCharge} onChange={(e) => handleChange('costing', 'loadingCharge', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Other Expenses (Optional)</label>
                            <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={formData.costing.otherExpenses} onChange={(e) => handleChange('costing', 'otherExpenses', e.target.value)} />
                        </div>
                        <div className="col-span-1 border-2 border-dashed border-red-300 p-2 rounded">
                            <label className="block text-sm font-medium text-red-700">Loading Commission (Deducted)</label>
                            <input type="number" className="mt-1 block w-full rounded-md border-red-300 shadow-sm bg-red-50"
                                value={formData.costing.loadingCommission} onChange={(e) => handleChange('costing', 'loadingCommission', e.target.value)} />
                            <p className="text-xs text-red-500 mt-1">Deducted from Hire Value</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Advance</label>
                            <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={formData.costing.advance} onChange={(e) => handleChange('costing', 'advance', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
                            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={formData.costing.paymentMode} onChange={(e) => handleChange('costing', 'paymentMode', e.target.value)}>
                                <option value="CASH">CASH</option>
                                <option value="NEFT">NEFT</option>
                                <option value="UPI">UPI</option>
                                <option value="IMPS">IMPS</option>
                                <option value="DIESEL">DIESEL</option>
                                <option value="CREDIT">CREDIT</option>
                                <option value="BOOK">BOOK</option>
                            </select>
                        </div>
                        {['NEFT', 'IMPS'].includes(formData.costing.paymentMode) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Payment Account</label>
                                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={formData.costing.paymentAccount} onChange={(e) => handleChange('costing', 'paymentAccount', e.target.value)}>
                                    <option value="">Select Account</option>
                                    <option value="0032">0032</option>
                                    <option value="4650">4650</option>
                                    <option value="5227">5227</option>
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Balance Payable</label>
                            <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                                value={(parseFloat(formData.costing.hireValue) || 0) - (parseFloat(formData.costing.advance) || 0) - (parseFloat(formData.costing.loadingCommission) || 0) - (parseFloat(formData.costing.otherExpenses) || 0)}
                                readOnly />
                            <p className="text-xs text-gray-500 mt-1">Hire - Adv - Comm - Exp</p>
                        </div>
                    </div>
                </div>

                {/* Section 5: Billing (Receivable from Consignor) */}
                <div className="bg-green-50 p-4 rounded-md mt-4">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Billing (Receivable from Consignor)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Gross Amount</label>
                            <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={formData.billing.grossAmount} onChange={(e) => handleChange('billing', 'grossAmount', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Loading Mamul</label>
                            <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={formData.billing.loadingMamul} onChange={(e) => handleChange('billing', 'loadingMamul', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Advance Received</label>
                            <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={formData.billing.advance} onChange={(e) => handleChange('billing', 'advance', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
                            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={formData.billing.paymentMode} onChange={(e) => handleChange('billing', 'paymentMode', e.target.value)}>
                                <option value="CASH">CASH</option>
                                <option value="NEFT">NEFT</option>
                                <option value="UPI">UPI</option>
                                <option value="IMPS">IMPS</option>
                                <option value="CHEQUE">CHEQUE</option>
                                <option value="BOOK">BOOK</option>
                            </select>
                        </div>
                        {['NEFT', 'IMPS'].includes(formData.billing.paymentMode) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Payment Account</label>
                                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    value={formData.billing.paymentAccount} onChange={(e) => handleChange('billing', 'paymentAccount', e.target.value)}>
                                    <option value="">Select Account</option>
                                    <option value="0032">0032</option>
                                    <option value="4650">4650</option>
                                    <option value="5227">5227</option>
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Balance Receivable</label>
                            <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                                value={(parseFloat(formData.billing.grossAmount) || 0) - (parseFloat(formData.billing.advance) || 0)}
                                readOnly />
                        </div>
                    </div>
                </div>

                {/* Section 6: Commission / Net Profit */}
                <div className="bg-yellow-50 p-4 rounded-md mt-4">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Commission / Net Profit</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Received (Initial)</label>
                            <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                                value={(parseFloat(formData.billing.advance) || 0) - (parseFloat(formData.costing.advance) || 0)}
                                readOnly />
                            <p className="text-xs text-gray-500 mt-1">Billing Adv - Costing Adv</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Pending</label>
                            <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                                value={(parseFloat(formData.costing.commission) || 0) - ((parseFloat(formData.billing.advance) || 0) - (parseFloat(formData.costing.advance) || 0))}
                                readOnly />
                            <p className="text-xs text-gray-500 mt-1">Net - Received</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Net Commission (Total)</label>
                            <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                                value={formData.costing.commission} readOnly />
                            <p className="text-xs text-gray-500 mt-1">Gross - (Hire - Loading Comm)</p>
                        </div>
                    </div>
                </div>

                {/* Section 7: Trip Status (Edit Mode Only) */}
                {trip && (
                    <div className="bg-blue-50 p-4 rounded-md mt-4 border border-blue-100">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">Trip Status</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Current Status</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={formData.status}
                                onChange={(e) => handleChange(null, 'status', e.target.value)}
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="ASSIGNED">ASSIGNED</option>
                                <option value="ACCEPTED">ACCEPTED</option>
                                <option value="STARTED">STARTED</option>
                                <option value="LOADING">LOADING</option>
                                <option value="IN_TRANSIT">IN TRANSIT</option>
                                <option value="UNLOADED">UNLOADED</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
                            </select>
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                    {trip && (
                        <div className="mr-auto flex gap-2">
                            <button
                                type="button"
                                onClick={() => generateHireSlip(trip, preferences)}
                                className="px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 flex items-center gap-2"
                            >
                                <FileText size={16} />
                                Download Hire Slip
                            </button>
                            <button
                                type="button"
                                onClick={() => generateConsignorSlip(trip, preferences)}
                                className="px-4 py-2 border border-teal-600 rounded-md shadow-sm text-sm font-medium text-teal-600 bg-white hover:bg-teal-50 flex items-center gap-2"
                            >
                                <FileText size={16} />
                                Download Consignor Slip
                            </button>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        Save Trip
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LogisticsTripForm;

