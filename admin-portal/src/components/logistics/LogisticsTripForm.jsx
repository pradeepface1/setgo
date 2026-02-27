import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Truck, Banknote, User, FileText, CheckCircle, AlertCircle, MapPin, MessageCircle } from 'lucide-react';
import { tripService, organizationService, consignorService } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { generateHireSlip } from '../../utils/generateHireSlip';
import { generateConsignorSlip } from '../../utils/generateConsignorSlip';
import { useAuth } from '../../context/AuthContext';

const DRAFT_KEY = 'logistics_trip_draft';

const LogisticsTripForm = ({ trip, onSave, onCancel, isQuickAdd = false }) => {
    const { preferences, user } = useAuth();
    const [formData, setFormData] = useState({
        tripDate: new Date().toISOString().split('T')[0],
        lorryNumber: '',
        route: { from: '', to: '' },
        consignor: { name: '', mobile: '' },
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
            },
            secondaryBankDetails: {
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
            toPayDate: new Date().toISOString().split('T')[0],
            toPayAmount: 0,
            toPayCommission: 0,
            toPayPendingCommission: 0,
            loadingCommission: 0,
            driverOtherExpensesDetails: [],
            paymentAccount: '',
            balancePaid: 0,
            balancePaidDate: '',
            balancePaymentMode: 'CASH',
            balancePaymentAccount: '',
            podStatus: 'No',
            podReceivedDate: ''
        },
        billing: {
            ratePerTon: 0,
            grossAmount: 0,
            loadingMamul: 0,
            unloadingMamul: 0,
            tds: 0,
            paymentMamul: 0,
            billedWeight: 0,
            roundOff: 0,
            paymentAccount: '',
            advance: 0,
            balanceReceived: 0,
            balanceReceivedDate: '',
            balanceReceiveMode: 'CASH',
            balanceReceiveAccount: ''
        },
        assignedDriverId: null,
        status: 'PENDING',
        loadingDate: new Date().toISOString().split('T')[0],
    });

    // Available Lorries State
    const [availableLorries, setAvailableLorries] = useState([]);
    const [fetchingLorries, setFetchingLorries] = useState(false);

    useEffect(() => {
        const fetchLorries = async () => {
            if (isQuickAdd) return; // Don't fetch if we are creating a draft
            setFetchingLorries(true);
            try {
                const response = await tripService.getTrips({ status: 'DRAFT', vertical: 'LOGISTICS' });
                // Response might be { trips: [], total: x } or just [] depending on API format
                setAvailableLorries(response.trips || response || []);
            } catch (err) {
                console.error("Failed to fetch available lorries:", err);
            } finally {
                setFetchingLorries(false);
            }
        };
        fetchLorries();
    }, [isQuickAdd]);

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
                    driverOtherExpensesDetails: trip.driverOtherExpensesDetails || [],
                    balancePaid: trip.driverBalancePaid || 0,
                    balancePaidDate: trip.driverBalancePaidDate ? new Date(trip.driverBalancePaidDate).toISOString().split('T')[0] : '',
                    balancePaymentMode: trip.driverBalancePaymentMode || 'CASH',
                    balancePaymentAccount: trip.driverBalancePaymentAccount || '',
                    podStatus: trip.podStatus || 'No',
                    podReceivedDate: trip.podReceivedDate ? new Date(trip.podReceivedDate).toISOString().split('T')[0] : '',
                    // To Pay fields — must be restored on edit
                    toPayAmount: trip.toPayAmount || 0,
                    toPayCommission: trip.toPayCommission || 0,
                    toPayPendingCommission: trip.toPayPendingCommission || 0,
                    toPayDate: trip.toPayDate ? new Date(trip.toPayDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                },
                billing: {
                    ratePerTon: trip.ratePerTon || 0,
                    grossAmount: trip.totalFreight || 0,
                    loadingMamul: trip.loadingMamul || 0,
                    unloadingMamul: trip.consignorUnloadingMamul || 0,
                    tds: trip.tds || 0,
                    paymentMamul: trip.consignorPaymentMamul || 0,
                    billedWeight: trip.billedWeight || trip.actualWeight || 0,
                    roundOff: trip.roundOff || 0,
                    advance: trip.consignorAdvance || 0,
                    paymentMode: trip.consignorAdvancePaymentMode || 'CASH',
                    paymentAccount: trip.consignorPaymentAccount || '',
                    balanceReceived: trip.consignorBalanceReceived || 0,
                    balanceReceivedDate: trip.consignorBalanceReceivedDate ? new Date(trip.consignorBalanceReceivedDate).toISOString().split('T')[0] : '',
                    balanceReceiveMode: trip.consignorBalanceReceiveMode || 'CASH',
                    balanceReceiveAccount: trip.consignorBalanceReceiveAccount || ''
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
                    name: trip.consignorId?.name || trip.consignorName || trip.consignor?.name || '',
                    _id: trip.consignorId?._id || trip.consignorId || trip.consignor?.referenceId,
                    mobile: trip.consignorMobile || trip.consignor?.mobile || trip.consignorId?.phone || trip.consignorId?.mobile || ''
                },
                consignmentItem: trip.consignmentItem || '', // Initialize here
                status: trip.status || 'PENDING', // Populate status
                handLoan: {
                    amount: trip.handLoan?.amount || 0,
                    paidDate: trip.handLoan?.paidDate ? new Date(trip.handLoan.paidDate).toISOString().split('T')[0] : '',
                    paymentMode: trip.handLoan?.paymentMode || 'CASH',
                    paymentAccount: trip.handLoan?.paymentAccount || '',
                    remarks: trip.handLoan?.remarks || ''
                },

            });

            // Handle Consignor Name if populated object (Update name ensuring it's not overwritten)
            if (trip.consignorId && typeof trip.consignorId === 'object') {
                setFormData(prev => ({
                    ...prev,
                    consignor: {
                        name: trip.consignorId.name || trip.consignor?.name,
                        _id: trip.consignorId._id || trip.consignor?.referenceId,
                        mobile: trip.consignorMobile || trip.consignor?.mobile || trip.consignorId.phone || trip.consignorId.mobile
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
                        },
                        secondaryBankDetails: {
                            accountName: driver.secondaryBankDetails?.accountName || '',
                            bankName: driver.secondaryBankDetails?.bankName || '',
                            accountNumber: driver.secondaryBankDetails?.accountNumber || '',
                            ifsc: driver.secondaryBankDetails?.ifscCode || ''
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
                    },
                    secondaryBankDetails: {
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
                    driverOtherExpensesDetails: []
                },
                billing: {
                    ratePerTon: 0,
                    grossAmount: 0,
                    loadingMamul: 0,
                    unloadingMamul: 0,
                    tds: 0,
                    paymentMamul: 0,
                    billedWeight: 0,
                    roundOff: 0,
                    advance: 0,
                    paymentMode: 'CASH',
                    paymentAccount: ''
                },
                assignedDriverId: null,
                status: 'PENDING',
                loadingDate: new Date().toISOString().split('T')[0],
                handLoan: {
                    amount: 0,
                    paidDate: '',
                    paymentMode: 'CASH',
                    paymentAccount: '',
                    remarks: ''
                },

            });
        }
    }, [trip]);


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
                },
                secondaryBankDetails: {
                    accountName: driver.secondaryBankDetails?.accountName || '',
                    bankName: driver.secondaryBankDetails?.bankName || '',
                    accountNumber: driver.secondaryBankDetails?.accountNumber || '',
                    ifsc: driver.secondaryBankDetails?.ifscCode || ''
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
                mobile: consignor.phone || '', // Map API phone to local mobile state
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

    const handleWhatsAppShare = () => {
        if (!formData.consignor.mobile) {
            alert("Please enter a valid Consignor Mobile Number first.");
            return;
        }

        const message = `*Trip Details:*\n\n` +
            `*Lorry Number:* ${formData.lorryNumber || 'N/A'}\n` +
            `*Lorry Name:* ${formData.marketVehicle?.lorryName || 'N/A'}\n` +
            `*Driver Name:* ${formData.marketVehicle?.driverName || 'N/A'}\n` +
            `*Driver Phone:* ${formData.marketVehicle?.driverPhone || 'N/A'}\n` +
            `*From:* ${formData.route?.from || 'N/A'}\n` +
            `*To:* ${formData.route?.to || 'N/A'}`;

        const encodedMessage = encodeURIComponent(message);

        // Remove non-numeric characters from phone (like +, -, spaces)
        let phone = formData.consignor.mobile.replace(/\D/g, '');

        // Basic check for India prefix if missing logic
        if (phone.length === 10) {
            phone = '91' + phone;
        }

        // Open WhatsApp Web API
        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const loadingCommission = parseFloat(formData.costing.loadingCommission) || 0;
        const totalHire = parseFloat(formData.costing.hireValue) || 0;
        const advance = parseFloat(formData.costing.advance) || 0;
        const totalOtherExpenses = formData.costing?.driverOtherExpensesDetails?.reduce((sum, exp) => sum + (parseFloat(exp?.amount) || 0), 0) || 0;

        // Determine Final Status
        let finalStatus = formData.status || 'PENDING';
        if (finalStatus === 'PENDING' && (formData.assignedDriverId || formData.lorryNumber || formData.marketVehicle?.lorryName)) {
            finalStatus = 'ASSIGNED';
        }

        // Transform data to match Backend Trip Model
        const payload = {
            ...formData,
            _id: formData._id, // Add this so parent can PATCH if it exists

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
            driverPaymentAccount: formData.costing.paymentMode === 'PRIMARY BANK'
                ? (formData.marketVehicle.bankDetails?.accountNumber || 'PRIMARY BANK')
                : formData.costing.paymentMode === 'SECONDARY BANK'
                    ? (formData.marketVehicle.secondaryBankDetails?.accountNumber || 'SECONDARY BANK')
                    : '',
            driverBalancePaid: formData.costing.balancePaid,
            driverBalancePaidDate: formData.costing.balancePaidDate ? new Date(formData.costing.balancePaidDate) : undefined,
            driverBalancePaymentMode: formData.costing.balancePaymentMode,
            driverBalancePaymentAccount: formData.costing.balancePaymentMode === 'PRIMARY BANK'
                ? (formData.marketVehicle.bankDetails?.accountNumber || 'PRIMARY BANK')
                : formData.costing.balancePaymentMode === 'SECONDARY BANK'
                    ? (formData.marketVehicle.secondaryBankDetails?.accountNumber || 'SECONDARY BANK')
                    : '',
            balancePayableToDriver: totalHire - advance - totalOtherExpenses - (parseFloat(formData.costing.balancePaid) || 0) - (parseFloat(formData.costing.toPayAmount) || 0), // Deduct expenses, balance paid, and any ToPay amount received by driver
            loadingCharge: formData.costing.loadingCharge,
            unloadingCharge: formData.costing.unloadingCharge,
            commissionAmount: formData.costing.commission,
            driverOtherExpenses: totalOtherExpenses,
            driverOtherExpensesDetails: formData.costing.driverOtherExpensesDetails,

            // 6. Consignor Financials
            consignorAdvance: formData.billing.advance,
            consignorAdvancePaymentMode: ['0032', '4650', '5227', '0112'].includes(formData.billing.paymentMode) ? 'NEFT' : formData.billing.paymentMode,
            consignorPaymentAccount: ['0032', '4650', '5227', '0112'].includes(formData.billing.paymentMode) ? formData.billing.paymentMode : '',
            consignorBalanceReceived: formData.billing.balanceReceived,
            consignorBalanceReceivedDate: formData.billing.balanceReceivedDate ? new Date(formData.billing.balanceReceivedDate) : undefined,
            consignorBalanceReceiveMode: ['0032', '4650', '5227', '0112'].includes(formData.billing.balanceReceiveMode) ? 'NEFT' : formData.billing.balanceReceiveMode,
            consignorBalanceReceiveAccount: ['0032', '4650', '5227', '0112'].includes(formData.billing.balanceReceiveMode) ? formData.billing.balanceReceiveMode : '',
            balanceReceivable: formData.billing.grossAmount - formData.billing.advance - (parseFloat(formData.billing.balanceReceived) || 0) + (parseFloat(formData.billing.roundOff) || 0) - (parseFloat(formData.billing.tds) || 0),
            billedWeight: formData.billing.billedWeight,
            loadingMamul: formData.billing.loadingMamul,
            consignorUnloadingMamul: formData.billing.unloadingMamul,
            tds: formData.billing.tds,
            consignorPaymentMamul: formData.billing.paymentMamul,
            roundOff: formData.billing.roundOff,
            podStatus: formData.costing.podStatus,
            podReceivedDate: formData.costing.podReceivedDate ? new Date(formData.costing.podReceivedDate) : undefined,

            // To Pay Tracking (Consignor pays Driver directly)
            toPayAmount: parseFloat(formData.costing.toPayAmount) || 0,
            toPayCommission: parseFloat(formData.costing.toPayCommission) || 0,
            toPayPendingCommission: parseFloat(formData.costing.toPayPendingCommission) || 0,
            toPayDate: formData.costing.toPayDate ? new Date(formData.costing.toPayDate) : undefined,

            // 2. Map Consignor
            consignorId: formData.consignor._id ? formData.consignor._id : undefined,
            consignorName: formData.consignor.name,
            consignorMobile: formData.consignor.mobile,
            consignor: { // Support for LogisticTrip nested model
                name: formData.consignor.name,
                mobile: formData.consignor.mobile,
                referenceId: formData.consignor._id ? formData.consignor._id : undefined
            },

            // 3. Map Route to Location
            loadingLocation: formData.route.from,
            unloadingLocation: formData.route.to,
            actualWeight: formData.weight.loaded, // Save Loaded Weight

            // 4. Map Driver
            assignedDriver: formData.assignedDriverId,
            status: isQuickAdd ? 'DRAFT' : finalStatus, // Use DRAFT for vehicle availability view

            // 5. Map Financials (Basic mapping, can be expanded)
            totalFreight: formData.billing.grossAmount,
            ratePerTon: formData.billing.ratePerTon,

            // 6. Hand Loan (amount given to driver at delivery point)
            handLoan: {
                amount: parseFloat(formData.handLoan?.amount) || 0,
                paidDate: formData.handLoan?.paidDate ? new Date(formData.handLoan.paidDate) : undefined,
                paymentMode: formData.handLoan?.paymentMode || 'CASH',
                paymentAccount: formData.handLoan?.paymentAccount || '',
                remarks: formData.handLoan?.remarks || ''
            }
        };

        if (isQuickAdd) {
            if (!payload.lorryName && !payload.vehicleNumber && !payload.assignedDriver) {
                alert("Please select a lorry or enter Lorry Name/Number.");
                return;
            }
            localStorage.removeItem(DRAFT_KEY);
            onSave(payload);
            onCancel?.();
        } else if (payload.consignorName && payload.loadingLocation && payload.unloadingLocation) {
            localStorage.removeItem(DRAFT_KEY);
            onSave(payload);
            onCancel?.();
        } else {
            alert("Please ensure Consignor and Route (From/To) are filled.");
        }
    };

    // Auto-calculate Hire Value
    useEffect(() => {
        const loadedWeight = parseFloat(formData.weight.loaded) || 0;
        const ratePerTon = parseFloat(formData.costing.ratePerTon) || 0;
        const loadingComm = parseFloat(formData.costing.loadingCommission) || 0;
        const hireValue = (loadedWeight * ratePerTon) - loadingComm;

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
    }, [formData.weight.loaded, formData.costing.ratePerTon, formData.costing.loadingCommission]);

    // Auto-calculate Consignor Gross Amount (mamul fields are DEDUCTIONS)
    useEffect(() => {
        const billedWeight = parseFloat(formData.billing.billedWeight) || 0;
        const ratePerTon = parseFloat(formData.billing.ratePerTon) || 0;
        const roundOff = parseFloat(formData.billing.roundOff) || 0;
        const loadingMamul = parseFloat(formData.billing.loadingMamul) || 0;
        const unloadingMamul = parseFloat(formData.billing.unloadingMamul) || 0;
        const paymentMamul = parseFloat(formData.billing.paymentMamul) || 0;
        const tds = parseFloat(formData.billing.tds) || 0;
        // Mamul fields and TDS reduce what the consignor actually pays
        const grossAmount = (billedWeight * ratePerTon) + roundOff - loadingMamul - unloadingMamul - paymentMamul - tds;

        setFormData(prev => {
            if (prev.billing.grossAmount !== grossAmount) {
                return { ...prev, billing: { ...prev.billing, grossAmount } };
            }
            return prev;
        });
    }, [formData.billing.billedWeight, formData.billing.ratePerTon, formData.billing.roundOff, formData.billing.loadingMamul, formData.billing.unloadingMamul, formData.billing.paymentMamul, formData.billing.tds]);

    // Auto-calculate Expected Commission: Gross - Hire (Since Hire is now net of Loading Comm)
    useEffect(() => {
        const gross = parseFloat(formData.billing.grossAmount) || 0;
        const hire = parseFloat(formData.costing.hireValue) || 0;
        const expectedCommission = gross - hire;

        setFormData(prev => {
            if (prev.costing.commission !== expectedCommission) {
                return {
                    ...prev,
                    costing: {
                        ...prev.costing,
                        commission: expectedCommission
                    }
                };
            }
            return prev;
        });
    }, [formData.billing.grossAmount, formData.costing.hireValue, formData.costing.loadingCommission]);

    // Auto-save draft to localStorage (only for new trips, not edits)
    useEffect(() => {
        if (!trip) {
            const draft = JSON.stringify(formData);
            localStorage.setItem(DRAFT_KEY, draft);
        }
    }, [formData, trip]);

    // Restore draft banner state
    const [hasDraft, setHasDraft] = useState(() => {
        if (trip) return false;
        const saved = localStorage.getItem(DRAFT_KEY);
        if (!saved) return false;
        try { const d = JSON.parse(saved); return !!(d.consignor?.name || d.lorryNumber || d.route?.from); }
        catch { return false; }
    });

    const restoreDraft = () => {
        try {
            const saved = localStorage.getItem(DRAFT_KEY);
            if (saved) { setFormData(JSON.parse(saved)); setHasDraft(false); }
        } catch { setHasDraft(false); }
    };

    const discardDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
    };

    // Helpers for dynamic Other Expenses
    const addExpense = () => {
        setFormData(prev => ({
            ...prev,
            costing: {
                ...prev.costing,
                driverOtherExpensesDetails: [
                    ...prev.costing.driverOtherExpensesDetails,
                    { expenseType: 'Others', customName: '', amount: 0 }
                ]
            }
        }));
    };

    const updateExpense = (index, field, value) => {
        setFormData(prev => {
            const newExpenses = [...prev.costing.driverOtherExpensesDetails];
            newExpenses[index] = { ...newExpenses[index], [field]: value };
            return {
                ...prev,
                costing: { ...prev.costing, driverOtherExpensesDetails: newExpenses }
            };
        });
    };

    const removeExpense = (index) => {
        setFormData(prev => {
            const newExpenses = [...prev.costing.driverOtherExpensesDetails];
            newExpenses.splice(index, 1);
            return {
                ...prev,
                costing: { ...prev.costing, driverOtherExpensesDetails: newExpenses }
            };
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel}></div>

            <div
                className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl border transition-colors duration-500 relative z-10 animate-in zoom-in-95 duration-200"
                style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}
            >
                <div
                    className="sticky top-0 z-20 backdrop-blur-md px-8 py-6 border-b flex justify-between items-center"
                    style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)', opacity: 0.95 }}
                >
                    <div>
                        <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text-main)' }}>
                            {trip ? 'Edit Trip' : (isQuickAdd ? 'Quick Add Lorry' : 'Create New Trip')}
                        </h2>
                        <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                            {isQuickAdd ? 'Add a lorry draft to the availability board' : 'Enter full trip details below'}
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-3 rounded-2xl transition-colors opacity-50 hover:opacity-100"
                        style={{ color: 'var(--theme-text-main)' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Draft restore banner — only for new trips */}
                        {hasDraft && !trip && (
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl border text-sm"
                                style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                                <span className="font-bold">📋 You have an unsaved draft. Restore it?</span>
                                <div className="flex gap-2">
                                    <button type="button" onClick={restoreDraft}
                                        className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest"
                                        style={{ backgroundColor: '#f59e0b', color: '#1a1a1a' }}>
                                        Restore
                                    </button>
                                    <button type="button" onClick={discardDraft}
                                        className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100"
                                        style={{ color: '#f59e0b' }}>
                                        Discard
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Available Lorry Selection (Only fully visible if not quick add) */}
                        {!isQuickAdd && availableLorries.length > 0 && (
                            <div
                                className="p-4 rounded-xl border flex flex-col gap-2 transition-colors duration-500"
                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}
                            >
                                <label className="block text-sm font-semibold flex items-center" style={{ color: 'var(--theme-text-main)' }}>
                                    <Truck className="h-4 w-4 mr-2" />
                                    Use Available Lorry
                                </label>
                                <select
                                    className="mt-1 block w-full rounded-xl border px-4 py-2 transition-all duration-300 focus:outline-none appearance-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-sidebar)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                    onChange={(e) => {
                                        const lorry = availableLorries.find(l => l._id === e.target.value);
                                        if (lorry) {
                                            setFormData(prev => ({
                                                ...prev,
                                                _id: lorry._id, // Store to trigger PATCH instead of POST
                                                lorryNumber: lorry.vehicleNumber || '',
                                                marketVehicle: {
                                                    ...prev.marketVehicle,
                                                    lorryName: lorry.lorryName || '',
                                                    ownerName: lorry.ownerName || '',
                                                    ownerPhone: lorry.ownerPhone || '',
                                                    driverName: lorry.driverName || '',
                                                    driverPhone: lorry.driverPhone || ''
                                                },
                                                assignedDriverId: lorry.assignedDriver || null
                                            }));
                                        } else {
                                            setFormData(prev => {
                                                const { _id, ...rest } = prev;
                                                return {
                                                    ...rest,
                                                    lorryNumber: '',
                                                    marketVehicle: { ...prev.marketVehicle, lorryName: '', ownerName: '', ownerPhone: '', driverName: '', driverPhone: '' }
                                                };
                                            });
                                        }
                                    }}
                                >
                                    <option value="">-- Select an Available Lorry (Optional) --</option>
                                    {availableLorries.map(lorry => (
                                        <option key={lorry._id} value={lorry._id}>
                                            {lorry.vehicleNumber || 'No Number'} - {lorry.lorryName || 'No Name'} {lorry.ownerName ? `(${lorry.ownerName})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Selecting a lorry will pre-fill its details and remove it from the available list when saved.</p>
                            </div>
                        )}

                        {/* Section 1: Trip Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Date</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                    value={formData.tripDate}
                                    onChange={(e) => handleChange(null, 'tripDate', e.target.value)}
                                    required={!isQuickAdd}
                                />
                            </div>
                            {/* RESTORED LORRY NUMBER */}
                            <div className="relative" ref={suggestionRef}>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Lorry Number</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="e.g. TN12A1234"
                                        className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none uppercase"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-card)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            color: 'var(--theme-text-main)'
                                        }}
                                        value={formData.lorryNumber}
                                        onChange={(e) => handleChange(null, 'lorryNumber', e.target.value)}
                                        autoComplete="off" // Disable browser autocomplete
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <ul className="absolute z-50 w-full border rounded-xl shadow-2xl mt-1 max-h-60 overflow-auto"
                                            style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                            {suggestions.map(driver => (
                                                <li
                                                    key={driver._id}
                                                    onClick={() => selectVehicle(driver)}
                                                    className="px-4 py-3 hover:bg-white/5 cursor-pointer flex justify-between items-center group transition-colors"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-bold tracking-tight" style={{ color: 'var(--theme-text-main)' }}>
                                                            {driver.vehicleNumber}
                                                        </span>
                                                        <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                                                            {driver.name} • {driver.ownerName || 'Own'}
                                                        </span>
                                                    </div>
                                                    <Truck className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--theme-primary)' }} />
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Lorry Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. N.S. KARUR ROADWAYS"
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                    value={formData.marketVehicle.lorryName}
                                    onChange={(e) => handleChange('marketVehicle', 'lorryName', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Driver Name</label>
                                <input
                                    type="text"
                                    placeholder="Driver Name"
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                    value={formData.marketVehicle.driverName}
                                    onChange={(e) => handleChange('marketVehicle', 'driverName', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Driver Phone</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Driver Phone"
                                        className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-card)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            color: 'var(--theme-text-main)'
                                        }}
                                        value={formData.marketVehicle.driverPhone}
                                        onChange={(e) => handleChange('marketVehicle', 'driverPhone', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        title="Share trip details on WhatsApp"
                                        onClick={() => {
                                            const msg = `*Trip Details:*\n\n` +
                                                `*Lorry Number:* ${formData.lorryNumber || 'N/A'}\n` +
                                                `*Lorry Name:* ${formData.marketVehicle?.lorryName || 'N/A'}\n` +
                                                `*Driver Name:* ${formData.marketVehicle?.driverName || 'N/A'}\n` +
                                                `*From:* ${formData.route?.from || 'N/A'}\n` +
                                                `*To:* ${formData.route?.to || 'N/A'}\n\n` +
                                                `*Consignor:* ${formData.consignor?.name || 'N/A'}\n` +
                                                `*Consignor Mobile:* ${formData.consignor?.mobile || 'N/A'}`;
                                            let phone = (formData.marketVehicle.driverPhone || '').replace(/\D/g, '');
                                            if (phone.length === 10) phone = '91' + phone;
                                            if (!phone) { alert('Please enter a driver phone number first.'); return; }
                                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                        }}
                                        className="px-4 py-2 rounded-xl transition-all duration-300 flex items-center justify-center shrink-0 hover:opacity-80"
                                        style={{ backgroundColor: '#25D366', color: 'white', border: '1px solid #1ebe5a' }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                                            <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-[10px] mt-1 opacity-60" style={{ color: 'var(--theme-text-muted)' }}>Click icon to share details via Web WhatsApp.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative" ref={consignorRef}>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Consignor Name *</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-card)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            color: 'var(--theme-text-main)'
                                        }}
                                        value={formData.consignor.name}
                                        onChange={(e) => handleChange('consignor', 'name', e.target.value)}
                                        required={!isQuickAdd}
                                        autoComplete="off"
                                    />
                                    {showConsignorSuggestions && consignorSuggestions.length > 0 && (
                                        <ul className="absolute z-50 w-full border rounded-xl shadow-2xl mt-1 max-h-60 overflow-auto"
                                            style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                            {consignorSuggestions.map(consignor => (
                                                <li
                                                    key={consignor._id}
                                                    onClick={() => selectConsignor(consignor)}
                                                    className="px-4 py-3 hover:bg-white/5 cursor-pointer flex justify-between items-center group transition-colors"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-bold tracking-tight" style={{ color: 'var(--theme-text-main)' }}>
                                                            {consignor.name}
                                                        </span>
                                                        <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                                                            {consignor.address || ''}
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Consignor Mobile</label>
                                <div className="flex gap-2 relative">
                                    <input
                                        type="tel"
                                        placeholder="e.g. 9876543210"
                                        className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-card)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            color: 'var(--theme-text-main)'
                                        }}
                                        value={formData.consignor.mobile}
                                        onChange={(e) => handleChange('consignor', 'mobile', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleWhatsAppShare}
                                        title="Share Trip Details via WhatsApp"
                                        className="px-4 py-2 rounded-xl transition-all duration-300 flex items-center justify-center shrink-0 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            backgroundColor: '#25D366', // Official WhatsApp green
                                            color: 'white',
                                            border: '1px solid #1ebe5a'
                                        }}
                                    >
                                        {/* Minimalist SVG WhatsApp Icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                                            <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-[10px] mt-1 opacity-60" style={{ color: 'var(--theme-text-muted)' }}>Click icon to share details via Web WhatsApp.</p>
                            </div>
                        </div>

                        {!isQuickAdd && (
                            <>
                                {/* Section 2: Route */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>From</label>
                                        <input type="text" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                            value={formData.route.from} onChange={(e) => handleChange('route', 'from', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>To</label>
                                        <input type="text" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                            value={formData.route.to} onChange={(e) => handleChange('route', 'to', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Loading Date *</label>
                                        <input type="date" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                            value={formData.loadingDate} onChange={(e) => handleChange(null, 'loadingDate', e.target.value)} required />
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px w-full my-6 opacity-10" style={{ backgroundColor: 'var(--theme-text-main)' }}></div>

                                {/* Section 3: Loading Details */}
                                <h3 className="text-lg font-bold tracking-tight mb-4" style={{ color: 'var(--theme-text-main)' }}>Loading Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Consignment Item</label>
                                        <input type="text" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                            value={formData.consignmentItem} onChange={(e) => handleChange(null, 'consignmentItem', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Loaded Weight (Tons)</label>
                                        <input type="number" step="0.01" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                            value={formData.weight.loaded} onChange={(e) => handleChange('weight', 'loaded', e.target.value)} />
                                    </div>
                                </div>

                                {/* Section 4: Costing (Payable to Lorry) */}
                                <div className="p-6 rounded-2xl mt-6 border transition-colors duration-500"
                                    style={{ backgroundColor: 'rgba(244, 63, 94, 0.03)', borderColor: 'rgba(244, 63, 94, 0.1)' }}>
                                    <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2" style={{ color: 'var(--theme-text-main)' }}>
                                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: '#f43f5e' }}></div>
                                        Costing (Payable to Lorry)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Rate Per Ton</label>
                                            <input type="number" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                value={formData.costing.ratePerTon} onChange={(e) => handleChange('costing', 'ratePerTon', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Hire Value (Auto)</label>
                                            <input type="number" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none opacity-60 cursor-not-allowed"
                                                style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                value={formData.costing.hireValue} readOnly />
                                        </div>

                                        <div className="p-3 rounded-xl border-2 border-dashed transition-colors duration-500"
                                            style={{ backgroundColor: 'rgba(244, 63, 94, 0.05)', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: '#f43f5e' }}>Loading Commission</label>
                                            <input type="number" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                                style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(244, 63, 94, 0.2)', color: 'var(--theme-text-main)' }}
                                                value={formData.costing.loadingCommission} onChange={(e) => handleChange('costing', 'loadingCommission', e.target.value)} />
                                            <p className="text-[10px] opacity-70 mt-1" style={{ color: '#f43f5e' }}>Deducted from Hire Value</p>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Advance</label>
                                            <input type="number" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                value={formData.costing.advance} onChange={(e) => handleChange('costing', 'advance', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Payment Mode</label>
                                            <select className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none appearance-none"
                                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                value={formData.costing.paymentMode} onChange={(e) => handleChange('costing', 'paymentMode', e.target.value)}>
                                                <option value="CASH">CASH</option>
                                                <option value="book">book</option>
                                                <option value="0032">0032</option>
                                                <option value="4650">4650</option>
                                                <option value="5227">5227</option>
                                                <option value="0112">0112</option>
                                                <option value="DIRECT_TO_DRIVER">DIRECT TO DRIVER (Hand Loan)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Dynamic Other Expenses Array */}
                                    <div className="mt-4 p-4 rounded-xl border transition-colors duration-500"
                                        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-bold tracking-tight" style={{ color: 'var(--theme-text-main)' }}>Other Deductible Expenses</h4>
                                            <button
                                                type="button"
                                                onClick={addExpense}
                                                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all"
                                                style={{ backgroundColor: 'var(--theme-primary)', color: 'white', opacity: 0.9 }}
                                            >
                                                + Add Expense
                                            </button>
                                        </div>
                                        {formData.costing.driverOtherExpensesDetails.map((expense, index) => (
                                            <div key={index} className="flex gap-2 items-start mb-3 pb-3 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                                <select
                                                    className="block w-1/3 rounded-xl border px-3 py-2 text-sm focus:outline-none transition-all"
                                                    style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                    value={expense.expenseType}
                                                    onChange={(e) => updateExpense(index, 'expenseType', e.target.value)}
                                                >
                                                    <option value="Payment Mamul">Payment Mamul</option>
                                                    <option value="Claim">Claim</option>
                                                    <option value="Loading/Unloading Charges">Loading/Unloading Charges</option>
                                                    <option value="Shortage">Shortage</option>
                                                    <option value="Others">Others</option>
                                                </select>
                                                {expense.expenseType === 'Others' && (
                                                    <input
                                                        type="text"
                                                        placeholder="Custom Reason"
                                                        className="block w-1/3 rounded-xl border px-3 py-2 text-sm focus:outline-none transition-all"
                                                        style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                        value={expense.customName || ''}
                                                        onChange={(e) => updateExpense(index, 'customName', e.target.value)}
                                                    />
                                                )}
                                                <input
                                                    type="number"
                                                    placeholder="Amount"
                                                    className="block w-1/3 rounded-xl border px-3 py-2 text-sm focus:outline-none transition-all"
                                                    style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                    value={expense?.amount || ''}
                                                    onChange={(e) => updateExpense(index, 'amount', e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeExpense(index)}
                                                    className="p-2 rounded-xl transition-colors hover:bg-rose-500/10 text-rose-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.costing.driverOtherExpensesDetails.length > 0 && (
                                            <div className="text-right text-xs font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--theme-text-main)' }}>
                                                Total Expenses: ₹{formData.costing?.driverOtherExpensesDetails?.reduce((sum, exp) => sum + (parseFloat(exp?.amount) || 0), 0) || 0}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section 4.5: Driver Balance Settlement */}
                                <div className="p-6 rounded-2xl mt-6 border transition-colors duration-500"
                                    style={{ backgroundColor: 'rgba(244, 63, 94, 0.03)', borderColor: 'rgba(244, 63, 94, 0.1)' }}>
                                    <h4 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-2" style={{ color: 'var(--theme-text-main)' }}>
                                        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: '#f43f5e' }}></div>
                                        Final Balance Clearance (Lorry)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Balance Paid Date</label>
                                            <input type="date" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                value={formData.costing.balancePaidDate} onChange={(e) => handleChange('costing', 'balancePaidDate', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Balance Paid Amount</label>
                                            <input type="number" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                value={formData.costing.balancePaid} onChange={(e) => handleChange('costing', 'balancePaid', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Payment Mode</label>
                                            <select className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none appearance-none"
                                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                value={formData.costing.balancePaymentMode} onChange={(e) => handleChange('costing', 'balancePaymentMode', e.target.value)}>
                                                <option value="CASH">CASH</option>
                                                <option value="book">book</option>
                                                <option value="0032">0032</option>
                                                <option value="4650">4650</option>
                                                <option value="5227">5227</option>
                                                <option value="0112">0112</option>
                                                <option value="DIRECT_TO_DRIVER">DIRECT TO DRIVER (Hand Loan)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Pending Balance</label>
                                            <input type="number" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none font-bold opacity-80 cursor-not-allowed"
                                                style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e' }}
                                                value={Math.max(0, (parseFloat(formData.costing?.hireValue) || 0) - (parseFloat(formData.costing?.advance) || 0) - (formData.costing?.driverOtherExpensesDetails?.reduce((sum, exp) => sum + (parseFloat(exp?.amount) || 0), 0) || 0) - (parseFloat(formData.costing?.balancePaid) || 0))}
                                                readOnly />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>POD Status</label>
                                            <select className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none appearance-none"
                                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                value={formData.costing.podStatus} onChange={(e) => handleChange('costing', 'podStatus', e.target.value)}>
                                                <option value="No">No</option>
                                                <option value="Yes">Yes</option>
                                                <option value="Late">Late</option>
                                                <option value="Shortage">Shortage</option>
                                                <option value="Plenty">Plenty</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>POD Received Date</label>
                                            <input type="date" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                value={formData.costing.podReceivedDate} onChange={(e) => handleChange('costing', 'podReceivedDate', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4.6: To Pay (Consignor-Direct Payment) */}
                                <div className="p-6 rounded-2xl mt-6 border transition-colors duration-500"
                                    style={{ backgroundColor: 'rgba(249, 115, 22, 0.03)', borderColor: 'rgba(249, 115, 22, 0.15)' }}>
                                    <h3 className="text-lg font-bold tracking-tight mb-1 flex items-center gap-2" style={{ color: 'var(--theme-text-main)' }}>
                                        <div className="w-1.5 h-6 rounded-full bg-orange-500"></div>
                                        To Pay
                                    </h3>
                                    <p className="text-xs mb-4 opacity-60" style={{ color: 'var(--theme-text-muted)' }}>Consignor pays driver directly. Driver returns commission to admin.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>To Pay Amount Received (₹)</label>
                                            <input type="number" placeholder="0"
                                                className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(249,115,22,0.2)', color: 'var(--theme-text-main)' }}
                                                value={formData.costing.toPayAmount}
                                                onChange={(e) => handleChange('costing', 'toPayAmount', e.target.value)} />
                                            <p className="text-[10px] mt-1 opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Full freight amount the consignor gave to the driver</p>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1 text-orange-400">Actual Commission (₹)</label>
                                            <input type="number" placeholder="0"
                                                className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                                style={{ backgroundColor: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.3)', color: 'var(--theme-text-main)' }}
                                                value={formData.costing.toPayCommission}
                                                onChange={(e) => handleChange('costing', 'toPayCommission', e.target.value)} />
                                            <p className="text-[10px] mt-1 opacity-60 text-orange-400">Commission driver must return to admin</p>
                                        </div>
                                    </div>
                                    {(parseFloat(formData.costing.toPayAmount) > 0 || parseFloat(formData.costing.toPayCommission) > 0) && (
                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1 text-rose-400">Pending Commission (₹)</label>
                                                <input type="number" placeholder="0"
                                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                                    style={{ backgroundColor: 'rgba(249,115,22,0.06)', borderColor: 'rgba(244,63,94,0.3)', color: '#f43f5e' }}
                                                    value={formData.costing.toPayPendingCommission}
                                                    onChange={(e) => handleChange('costing', 'toPayPendingCommission', e.target.value)} />
                                                <p className="text-[10px] mt-1 opacity-60 text-rose-400">Commission still owed to admin</p>
                                            </div>
                                            <div className="px-4 py-3 rounded-xl text-xs font-bold flex flex-col gap-0.5"
                                                style={{ backgroundColor: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
                                                <span className="text-[10px] opacity-60 font-normal">Net Driver Keeps</span>
                                                <span className="text-lg font-black">₹{Math.max(0, (parseFloat(formData.costing.toPayAmount) || 0) - (parseFloat(formData.costing.toPayCommission) || 0)).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section 5: Billing (Receivable from Consignor) */}
                                <div className="p-6 rounded-2xl mt-6 border transition-colors duration-500"
                                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.03)', borderColor: 'rgba(34, 197, 94, 0.1)' }}>
                                    <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2" style={{ color: 'var(--theme-text-main)' }}>
                                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
                                        Billing (Receivable from Consignor)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Gross Amount (Auto)</label>
                                            <input type="number" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none font-bold opacity-80 cursor-not-allowed"
                                                style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}
                                                value={formData.billing.grossAmount} readOnly />
                                        </div>
                                        <div className="p-4 rounded-xl border transition-colors duration-500 col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3"
                                            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--theme-text-muted)' }}>Rate Per Ton</label>
                                                <input type="number" className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none transition-all"
                                                    style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                    value={formData.billing.ratePerTon} onChange={(e) => handleChange('billing', 'ratePerTon', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--theme-text-muted)' }}>Billed Weight</label>
                                                <input type="number" className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none transition-all"
                                                    style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                    value={formData.billing.billedWeight} onChange={(e) => handleChange('billing', 'billedWeight', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--theme-text-muted)' }}>Round Off</label>
                                                <input type="number" className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none transition-all"
                                                    style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                    value={formData.billing.roundOff} onChange={(e) => handleChange('billing', 'roundOff', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--theme-text-muted)' }}>Loading Mamul</label>
                                                <input type="number" className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none transition-all"
                                                    style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                    value={formData.billing.loadingMamul} onChange={(e) => handleChange('billing', 'loadingMamul', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--theme-text-muted)' }}>Unloading Mamul</label>
                                                <input type="number" className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none transition-all"
                                                    style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                    value={formData.billing.unloadingMamul} onChange={(e) => handleChange('billing', 'unloadingMamul', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--theme-text-muted)' }}>Payment Mamul</label>
                                                <input type="number" className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none transition-all"
                                                    style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                    value={formData.billing.paymentMamul} onChange={(e) => handleChange('billing', 'paymentMamul', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--theme-text-muted)' }}>TDS Deduction</label>
                                                <input type="number" className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none transition-all"
                                                    style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)', color: '#f43f5e' }}
                                                    value={formData.billing.tds} onChange={(e) => handleChange('billing', 'tds', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Advance Received</label>
                                            <input type="number" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                value={formData.billing.advance} onChange={(e) => handleChange('billing', 'advance', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Payment Mode</label>
                                            <select className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none appearance-none"
                                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                value={formData.billing.paymentMode} onChange={(e) => handleChange('billing', 'paymentMode', e.target.value)}>
                                                <option value="CASH">CASH</option>
                                                <option value="book">book</option>
                                                <option value="0032">0032</option>
                                                <option value="4650">4650</option>
                                                <option value="5227">5227</option>
                                                <option value="0112">0112</option>
                                                <option value="DIRECT_TO_DRIVER">DIRECT TO DRIVER (Hand Loan)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 5.5: Consignor Balance Settlement */}
                                <div className="p-6 rounded-2xl mt-6 border transition-colors duration-500"
                                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.03)', borderColor: 'rgba(34, 197, 94, 0.1)' }}>
                                    <h4 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-2" style={{ color: 'var(--theme-text-main)' }}>
                                        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
                                        Final Balance Clearance (Consignor)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Balance Received Date</label>
                                            <input type="date" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                value={formData.billing.balanceReceivedDate} onChange={(e) => handleChange('billing', 'balanceReceivedDate', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Received Amount</label>
                                            <input type="number" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                value={formData.billing.balanceReceived} onChange={(e) => handleChange('billing', 'balanceReceived', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Receive Mode</label>
                                            <select className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none appearance-none"
                                                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                                value={formData.billing.balanceReceiveMode} onChange={(e) => handleChange('billing', 'balanceReceiveMode', e.target.value)}>
                                                <option value="CASH">CASH</option>
                                                <option value="book">book</option>
                                                <option value="0032">0032</option>
                                                <option value="4650">4650</option>
                                                <option value="5227">5227</option>
                                                <option value="0112">0112</option>
                                                <option value="DIRECT_TO_DRIVER">DIRECT TO DRIVER (Hand Loan)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Outstanding Balance</label>
                                            <input type="number" className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none font-bold opacity-80 cursor-not-allowed"
                                                style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}
                                                value={Math.max(0, (parseFloat(formData.billing.grossAmount) || 0) - (parseFloat(formData.billing.advance) || 0) - (parseFloat(formData.billing.balanceReceived) || 0))}
                                                readOnly />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 6: Commission / Net Profit – Hidden from LOGISTICS_STAFF */}
                                {user?.role !== 'LOGISTICS_STAFF' && (
                                    <div className="p-6 rounded-2xl mt-6 border transition-all duration-500"
                                        style={{ backgroundColor: 'rgba(234, 179, 8, 0.03)', borderColor: 'rgba(234, 179, 8, 0.1)' }}>
                                        <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2" style={{ color: 'var(--theme-text-main)' }}>
                                            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: '#eab308' }}></div>
                                            Commission / Net Profit
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-4 rounded-xl border transition-colors duration-500" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--theme-text-muted)' }}>Realized (To Date)</label>
                                                <div className="text-xl font-black" style={{ color: 'var(--theme-text-main)' }}>
                                                    ₹{Math.round(((parseFloat(formData.billing.advance) || 0) + (parseFloat(formData.billing.balanceReceived) || 0)) - ((parseFloat(formData.costing.advance) || 0) + (parseFloat(formData.costing.balancePaid) || 0)))}
                                                </div>
                                                <p className="text-[10px] opacity-60 mt-1" style={{ color: 'var(--theme-text-muted)' }}>Total Received - Total Paid</p>
                                            </div>
                                            <div className="p-4 rounded-xl border transition-colors duration-500" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--theme-text-muted)' }}>Pending Recovery</label>
                                                <div className="text-xl font-black" style={{ color: (parseFloat(formData.costing.commission) || 0) - (((parseFloat(formData.billing.advance) || 0) + (parseFloat(formData.billing.balanceReceived) || 0)) - ((parseFloat(formData.costing.advance) || 0) + (parseFloat(formData.costing.balancePaid) || 0))) < 0 ? '#f43f5e' : '#22c55e' }}>
                                                    ₹{Math.round((parseFloat(formData.costing.commission) || 0) - (((parseFloat(formData.billing.advance) || 0) + (parseFloat(formData.billing.balanceReceived) || 0)) - ((parseFloat(formData.costing.advance) || 0) + (parseFloat(formData.costing.balancePaid) || 0))))}
                                                </div>
                                                <p className="text-[10px] opacity-60 mt-1" style={{ color: 'var(--theme-text-muted)' }}>Expected Net - Total Realized</p>
                                            </div>
                                            <div className="p-4 rounded-xl border transition-colors duration-500" style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--theme-text-muted)' }}>Expected Net Commission</label>
                                                <div className="text-xl font-black" style={{ color: 'var(--theme-primary)' }}>
                                                    ₹{Math.round(formData.costing.commission)}
                                                </div>
                                                <p className="text-[10px] opacity-60 mt-1" style={{ color: 'var(--theme-text-muted)' }}>Gross Amount - Hire Value</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Section 7: Trip Status */}
                        {trip && !isQuickAdd && (
                            <div className="p-6 rounded-2xl mt-6 border transition-all duration-500"
                                style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2" style={{ color: 'var(--theme-text-main)' }}>
                                    <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }}></div>
                                    Trip Operations Status
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Current Status</label>
                                        <select className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none appearance-none font-bold"
                                            style={{
                                                backgroundColor: 'var(--theme-bg-card)',
                                                borderColor: 'rgba(255,255,255,0.1)',
                                                color: formData.status === 'COMPLETED' ? '#22c55e' : '#38bdf8'
                                            }}
                                            value={formData.status}
                                            onChange={(e) => handleChange(null, 'status', e.target.value)}>
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
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            {trip && (
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => generateHireSlip(trip, preferences)}
                                        className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border active:scale-95 flex items-center gap-2"
                                        style={{ borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)', backgroundColor: 'transparent' }}
                                    >
                                        <FileText size={14} />
                                        Hire Slip
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => generateConsignorSlip(trip, preferences)}
                                        className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border active:scale-95 flex items-center gap-2"
                                        style={{ borderColor: 'rgba(20, 184, 166, 0.5)', color: '#14b8a6', backgroundColor: 'transparent' }}
                                    >
                                        <FileText size={14} />
                                        Consignor Slip
                                    </button>
                                </div>
                            )}
                            {!trip && <div />}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:bg-white/5 active:scale-95"
                                    style={{ color: 'var(--theme-text-muted)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-10 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}
                                >
                                    {trip ? 'Update Trip' : 'Save Trip'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LogisticsTripForm;
