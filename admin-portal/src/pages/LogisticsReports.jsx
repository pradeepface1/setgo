import React, { useState, useEffect } from 'react';
import { reportsService, consignorService, tripService, organizationService } from '../services/api';
import { Download, Filter, TrendingUp, AlertCircle, Clock, Truck, DollarSign, PackageCheck, Banknote, History, CheckCircle2, X, Edit, BarChart3, PieChart, LayoutDashboard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';

const LogisticsReports = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [analyticalData, setAnalyticalData] = useState(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [consignors, setConsignors] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [filters, setFilters] = useState({ consignorId: '', driverId: '', organizationId: '' });
    const [milestones, setMilestones] = useState(null);
    const [activeTab, setActiveTab] = useState('financials');
    const [reportMode, setReportMode] = useState('logistics'); // 'logistics' | 'handloan'
    const [handLoanData, setHandLoanData] = useState(null);

    const [milestoneDetails, setMilestoneDetails] = useState([]);
    const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
    const [milestoneLoading, setMilestoneLoading] = useState(false);
    const [selectedMilestoneTitle, setSelectedMilestoneTitle] = useState('');
    const [milestoneSearch, setMilestoneSearch] = useState('');

    const [consignorLedgerSearch, setConsignorLedgerSearch] = useState('');
    const [driverPayableSearch, setDriverPayableSearch] = useState('');

    const [recoverModalOpen, setRecoverModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [recoverData, setRecoverData] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });

    const openRecoverModal = (loan) => {
        setSelectedLoan(loan);
        setRecoverData({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
        setRecoverModalOpen(true);
    };

    const handleRecoverSubmit = async (e) => {
        e.preventDefault();
        try {
            await tripService.recoverHandLoan(selectedLoan._id, {
                amount: parseFloat(recoverData.amount),
                date: recoverData.date,
                note: recoverData.note
            });
            setRecoverModalOpen(false);
            fetchReports(); // Refresh data
        } catch (error) {
            console.error("Failed to recover hand loan", error);
            alert("Failed to save payment");
        }
    };

    useEffect(() => { loadFilters(); }, [user]);
    useEffect(() => { fetchReports(); }, [dateRange.start, dateRange.end, filters.consignorId, filters.driverId, filters.organizationId]);

    const loadFilters = async () => {
        try {
            if (user?.role === 'SUPER_ADMIN') {
                const orgs = await organizationService.getAll('LOGISTICS');
                setOrganizations(orgs || []);
            } else {
                const [consignorData, driverData] = await Promise.all([
                    consignorService.getAll(),
                    tripService.getDrivers({ vertical: 'LOGISTICS' })
                ]);
                setConsignors(consignorData || []);
                setDrivers(driverData.drivers || driverData || []);
            }
        } catch (error) {
            console.error("Failed to load filters", error);
        }
    };

    const handleMilestoneClick = async (milestoneKey, title) => {
        if (!milestones) return;
        setMilestoneModalOpen(true);
        setSelectedMilestoneTitle(title);
        setMilestoneLoading(true);
        try {
            const params = {
                ...(dateRange.start && { startDate: dateRange.start }),
                ...(dateRange.end && { endDate: dateRange.end }),
                ...(filters.consignorId && { consignorId: filters.consignorId }),
                ...(filters.driverId && { driverId: filters.driverId }),
                ...(filters.organizationId && { organizationId: filters.organizationId }),
                milestone: milestoneKey
            };
            const details = await tripService.getMilestoneDetails(params);
            setMilestoneDetails(details || []);
            setMilestoneSearch(''); // Reset search when opening a new milestone
        } catch (error) {
            console.error("Failed to fetch milestone details", error);
        } finally {
            setMilestoneLoading(false);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = {
                ...(dateRange.start && { startDate: dateRange.start }),
                ...(dateRange.end && { endDate: dateRange.end }),
                ...(filters.consignorId && { consignorId: filters.consignorId }),
                ...(filters.driverId && { driverId: filters.driverId }),
                ...(filters.organizationId && { organizationId: filters.organizationId })
            };

            const [financials, analytical, aging, ops, milestoneData, handLoans] = await Promise.all([
                reportsService.getFinancials(params),
                reportsService.getAnalytical(params),
                reportsService.getAging(params),
                reportsService.getOperations(params),
                tripService.getMilestones({ ...params, vertical: 'LOGISTICS' }),
                reportsService.getHandLoans(params)
            ]);

            setData({
                profitability: financials.profitability,
                summary: financials.summary,
                driverBalancePending: financials.driverBalancePending,
                consignorBalances: aging.consignorBalances,
                driverLedger: ops.driverLedger
            });
            setAnalyticalData(analytical);
            setMilestones(milestoneData);
            setHandLoanData(handLoans);

        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!data) return;
        const wb = XLSX.utils.book_new();

        // ── Sheet 1: Lorry Ledger ──────────────────────────────────────────────
        // Per-trip lorry payable breakdown
        if (data.profitability && data.profitability.length > 0) {
            const lorryRows = data.profitability.map(item => {
                const hireValue = parseFloat(item.driverPayable || item.totalHireValue || item.hireValue || 0);
                const advance = parseFloat(item.driverAdvance || item.costingAdvance || 0);
                const balance = parseFloat(item.lorryBalance ?? (hireValue - advance));
                const commission = parseFloat(item.driverLoadingCommission || 0);
                return {
                    'Date': item.date ? new Date(item.date).toLocaleDateString('en-IN') : '',
                    'Lorry Number': item.vehicleNumber || '',
                    'Consignor': item.consignorName || item.consignor?.name || '',
                    'Consignor Mobile': item.consignorMobile || item.consignor?.mobile || '',
                    'Destination (To)': item.to || item.unloadingLocation || '',
                    'Gross Hire (Before Comm)': (item.toPayAmount ? (item.toPayAmount + commission) : (hireValue + commission)),
                    'Loading Commission': commission,
                    'Lorry Hire Total (Net)': item.toPayAmount || hireValue,
                    'Lorry Advance': advance,
                    'Lorry Balance': item.toPayAmount ? (item.toPayAmount - advance) : balance,
                    'To Pay Amount': parseFloat(item.toPayAmount || 0),
                    'To Pay Commission': parseFloat(item.toPayCommission || 0),
                };
            });
            const ws1 = XLSX.utils.json_to_sheet(lorryRows);
            XLSX.utils.book_append_sheet(wb, ws1, 'Lorry Ledger');
        }

        // ── Sheet 2: Consignor Ledger ──────────────────────────────────────────
        // Per-trip consignor billing breakdown
        if (data.profitability && data.profitability.length > 0) {
            const consignorRows = data.profitability.map(item => {
                const totalAmt = parseFloat(item.consignorTotal || item.totalFreight || item.totalHireValue || 0);
                const advanceAmt = parseFloat(item.consignorAdvance || item.billingAdvance || 0);
                const balance = parseFloat(item.consignorBalance ?? (totalAmt - advanceAmt));
                return {
                    'Date': item.date ? new Date(item.date).toLocaleDateString('en-IN') : '',
                    'Lorry Number': item.vehicleNumber || '',
                    'Consignor': item.consignorName || item.consignor?.name || '',
                    'Consignor Mobile': item.consignorMobile || item.consignor?.mobile || '',
                    'Destination (To)': item.to || item.unloadingLocation || '',
                    'Consignor Total Amount': item.toPayAmount || totalAmt,
                    'Consignor Advance': item.toPayAmount ? item.toPayAmount : advanceAmt,
                    'Consignor Balance': item.toPayAmount ? 0 : balance,
                };
            });
            const ws2 = XLSX.utils.json_to_sheet(consignorRows);
            XLSX.utils.book_append_sheet(wb, ws2, 'Consignor Ledger');
        }

        // ── Sheet 3: To Pay Ledger ─────────────────────────────────────────────
        // Filter only trips where consignor pays the driver directly (To Pay trips)
        const toPayTrips = data.profitability?.filter(item =>
            item.consignorBalanceReceiveMode === 'DIRECT_TO_DRIVER'
        ) || [];
        if (toPayTrips.length > 0) {
            const toPayRows = toPayTrips.map(item => {
                const totalFreight = parseFloat(item.toPayAmount || 0); // = totalFreight for DIRECT_TO_DRIVER
                const commission = parseFloat(item.toPayCommission || 0); // = commissionAmount
                const netToPay = totalFreight - commission;
                return {
                    'Date': item.date ? new Date(item.date).toLocaleDateString('en-IN') : '',
                    'Lorry Number': item.vehicleNumber || '',
                    'Consignor': item.consignorName || item.consignor?.name || '',
                    'Consignor Mobile': item.consignorMobile || item.consignor?.mobile || '',
                    'Destination': item.to || item.unloadingLocation || '',
                    'Total Freight (Consignor → Driver)': totalFreight,
                    'Commission Owed to Company': commission,
                    'Net To Pay (Driver → Company)': netToPay,
                    'Status': item.driverBalanceStatus?.replace(/_/g, ' ') || 'PENDING',
                };
            });
            const ws4 = XLSX.utils.json_to_sheet(toPayRows);
            XLSX.utils.book_append_sheet(wb, ws4, 'To Pay Ledger');
        }

        XLSX.writeFile(wb, `Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const inputStyle = {
        backgroundColor: 'var(--theme-bg-sidebar)',
        borderColor: 'rgba(255,255,255,0.1)',
        color: 'var(--theme-text-main)'
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    {/* Logistics / Hand Loan Toggle */}
                    <div className="flex items-center rounded-xl p-1 gap-1" style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <button
                            onClick={() => setReportMode('logistics')}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                            style={{
                                backgroundColor: reportMode === 'logistics' ? 'var(--theme-primary)' : 'transparent',
                                color: reportMode === 'logistics' ? '#fff' : 'var(--theme-text-muted)'
                            }}
                        >
                            Logistics
                        </button>
                        <button
                            onClick={() => setReportMode('handloan')}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                            style={{
                                backgroundColor: reportMode === 'handloan' ? '#f59e0b' : 'transparent',
                                color: reportMode === 'handloan' ? '#fff' : 'var(--theme-text-muted)'
                            }}
                        >
                            Hand Loan
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">

                    {/* Organization Filter (Super Admin Only) */}
                    {user?.role === 'SUPER_ADMIN' ? (
                        <select
                            value={filters.organizationId}
                            onChange={(e) => setFilters(prev => ({ ...prev, organizationId: e.target.value }))}
                            className="text-sm rounded-xl border focus:outline-none p-2.5 transition-all appearance-none pr-8"
                            style={inputStyle}
                        >
                            <option value="">All Organizations</option>
                            {organizations.map(org => (
                                <option key={org._id} value={org._id}>{org.name}</option>
                            ))}
                        </select>
                    ) : (
                        <>
                            {/* Consignor Filter */}
                            <select
                                value={filters.consignorId}
                                onChange={(e) => setFilters(prev => ({ ...prev, consignorId: e.target.value }))}
                                className="text-sm rounded-xl border focus:outline-none p-2.5 transition-all appearance-none pr-8"
                                style={inputStyle}
                            >
                                <option value="">All Consignors</option>
                                {consignors.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>

                            {/* Driver Filter */}
                            <select
                                value={filters.driverId}
                                onChange={(e) => setFilters(prev => ({ ...prev, driverId: e.target.value }))}
                                className="text-sm rounded-xl border focus:outline-none p-2.5 transition-all appearance-none pr-8"
                                style={inputStyle}
                            >
                                <option value="">All Drivers</option>
                                {drivers.map(d => (
                                    <option key={d._id} value={d._id}>{d.name} ({d.vehicleNumber})</option>
                                ))}
                            </select>
                        </>
                    )}

                    <div className="flex gap-2 p-1 rounded-xl border items-center" style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)' }}>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="bg-transparent border-none focus:outline-none p-1.5 text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: '#ffffff', colorScheme: 'dark' }}
                        />
                        <span className="opacity-40" style={{ color: 'var(--theme-text-muted)' }}>-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="bg-transparent border-none focus:outline-none p-1.5 text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: '#ffffff', colorScheme: 'dark' }}
                        />
                        {(dateRange.start || dateRange.end) && (
                            <button
                                onClick={() => setDateRange({ start: '', end: '' })}
                                className="p-1.5 rounded-lg hover:bg-white/5 opacity-50 hover:opacity-100 transition-all mr-1"
                                style={{ color: 'var(--theme-text-main)' }}
                                title="Clear Dates"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-lg hover:-translate-y-0.5 active:scale-95"
                        style={{ backgroundColor: '#10b981', color: 'white' }}
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* ─── HAND LOAN REPORT ─────────────────────────────────────────────── */}
            {reportMode === 'handloan' && (
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full" style={{ borderColor: '#f59e0b', borderTopColor: 'transparent' }}></div>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { label: 'Total Issued', value: handLoanData?.summary?.totalIssued || 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                                    { label: 'Recovered', value: handLoanData?.summary?.totalRecovered || 0, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                                    { label: 'Pending Recovery', value: handLoanData?.summary?.totalPending || 0, color: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
                                ].map(card => (
                                    <div key={card.label} className="rounded-2xl p-5 border" style={{ backgroundColor: card.bg, borderColor: `${card.color}33` }}>
                                        <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: card.color }}>{card.label}</div>
                                        <div className="text-3xl font-black" style={{ color: card.color }}>₹{card.value.toLocaleString()}</div>
                                        <div className="text-[10px] mt-1 opacity-60 flex gap-2" style={{ color: 'var(--theme-text-muted)' }}>
                                            {/* Removed 'trips with hand loan' text as requested */}
                                            <span></span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Detail Table */}
                            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                <div className="px-6 py-4 border-b flex items-center gap-3" style={{ backgroundColor: 'rgba(245,158,11,0.05)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <div className="w-1.5 h-4 rounded-full bg-amber-500"></div>
                                    <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--theme-text-main)' }}>Hand Loan Detail</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <thead style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                            <tr>
                                                {['Date', 'Driver / Vehicle', 'Handloan', 'Received', 'Pending', 'Status', 'Action'].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                                            {(handLoanData?.handLoanTrips || []).map((trip, idx) => {
                                                const statusColor = trip.driverBalanceStatus === 'COLLECTED' ? '#10b981' : trip.driverBalanceStatus === 'PARTIALLY_COLLECTED' ? '#f59e0b' : '#f43f5e';
                                                const statusBg = trip.driverBalanceStatus === 'COLLECTED' ? 'rgba(16,185,129,0.1)' : trip.driverBalanceStatus === 'PARTIALLY_COLLECTED' ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)';
                                                return (
                                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--theme-text-main)' }}>{trip.date ? new Date(trip.date).toLocaleDateString('en-IN') : '—'}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--theme-text-main)' }}>
                                                            <div className="font-bold">{trip.driverName}</div>
                                                            <div className="opacity-50 text-[10px]">{trip.vehicleNumber}</div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-amber-500">₹{trip.handLoanAmount?.toLocaleString()}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-emerald-500">₹{trip.driverBalanceCollectedAmount?.toLocaleString()}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-black text-rose-500">₹{trip.driverBalancePendingAmount?.toLocaleString()}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-center">
                                                            <span className="px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-full" style={{ backgroundColor: statusBg, color: statusColor }}>
                                                                {trip.driverBalanceStatus?.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-center">
                                                            <button
                                                                onClick={() => openRecoverModal(trip)}
                                                                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                                                                style={{ color: 'var(--theme-text-muted)' }}
                                                                title="Record Payment"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {(!handLoanData?.handLoanTrips || handLoanData.handLoanTrips.length === 0) && (
                                                <tr><td colSpan="10" className="text-center py-10 text-xs opacity-40" style={{ color: 'var(--theme-text-muted)' }}>No hand loan trips found for this period.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ─── LOGISTICS REPORT (Tabs) ──────────────────────────────────────── */}
            {reportMode === 'logistics' && (<>
                {/* Tabs */}
                <div className="border-b flex gap-6" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <button
                        onClick={() => setActiveTab('financials')}
                        className={`py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'financials' ? 'opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        style={{
                            borderColor: activeTab === 'financials' ? 'var(--theme-primary)' : 'transparent',
                            color: activeTab === 'financials' ? 'var(--theme-primary)' : 'var(--theme-text-main)'
                        }}
                    >
                        Financials
                    </button>
                    <button
                        onClick={() => setActiveTab('operations')}
                        className={`py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'operations' ? 'opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        style={{
                            borderColor: activeTab === 'operations' ? 'var(--theme-primary)' : 'transparent',
                            color: activeTab === 'operations' ? 'var(--theme-primary)' : 'var(--theme-text-main)'
                        }}
                    >
                        Operations Milestones
                    </button>
                    <button
                        onClick={() => setActiveTab('projections')}
                        className={`py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'projections' ? 'opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        style={{
                            borderColor: activeTab === 'projections' ? 'var(--theme-primary)' : 'transparent',
                            color: activeTab === 'projections' ? 'var(--theme-primary)' : 'var(--theme-text-main)'
                        }}
                    >
                        Projections
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full" style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }}></div>
                    </div>
                ) : data ? (
                    <div className="space-y-8">
                        {/* Milestones / Operations Funnel */}
                        {activeTab === 'operations' && milestones && (
                            <div>
                                <h2 className="text-lg font-black tracking-tight mb-4" style={{ color: 'var(--theme-text-main)' }}>Operations Milestone Tracking</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div
                                        onClick={() => handleMilestoneClick('advancePaid', 'Lorry Advance Given Trips')}
                                        className="rounded-2xl border p-5 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                                        style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                                        <Banknote className="h-8 w-8 text-amber-500 mb-2 opacity-80" />
                                        <span className="text-3xl font-black" style={{ color: 'var(--theme-text-main)' }}>{milestones.advancePaid || 0}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Lorry Adv. Given</span>
                                    </div>
                                    <div
                                        onClick={() => handleMilestoneClick('lorryAdvancePending', 'Lorry Advance Pending Trips')}
                                        className="rounded-2xl border p-5 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                                        style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                                        <Clock className="h-8 w-8 text-rose-500 mb-2 opacity-80" />
                                        <span className="text-3xl font-black" style={{ color: 'var(--theme-text-main)' }}>{milestones.lorryAdvancePending || 0}</span>
                                        <span className="text-[10px] font-bold text-center uppercase tracking-widest mt-1 opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Lorry Adv. Pending</span>
                                    </div>
                                    <div
                                        onClick={() => handleMilestoneClick('consignorGiven', 'Consignor Given Trips')}
                                        className="rounded-2xl border p-5 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                                        style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 opacity-80" />
                                        <span className="text-3xl font-black" style={{ color: 'var(--theme-text-main)' }}>{milestones.consignorGiven || 0}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Consignor Given</span>
                                    </div>
                                    <div
                                        onClick={() => handleMilestoneClick('consignorPending', 'Consignor Pending Trips')}
                                        className="rounded-2xl border p-5 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                                        style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
                                        <AlertCircle className="h-8 w-8 text-orange-500 mb-2 opacity-80" />
                                        <span className="text-3xl font-black" style={{ color: 'var(--theme-text-main)' }}>{milestones.consignorPending || 0}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Consignor Pending</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Financials View */}
                        {activeTab === 'financials' && (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Commission Section */}
                                    <div className="p-5 rounded-2xl border flex flex-col gap-3" style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-2" style={{ color: 'var(--theme-text-muted)' }}>
                                            <History className="h-3 w-3" /> Commission
                                        </h3>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] opacity-60">Received</span>
                                                <span className="text-sm font-black text-emerald-500">₹{(data.summary?.commission?.received || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] opacity-60">Pending</span>
                                                <span className="text-sm font-black text-rose-500">₹{(data.summary?.commission?.pending || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* To Pay Section */}
                                    <div className="p-5 rounded-2xl border flex flex-col gap-3" style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(249,115,22,0.15)' }}>
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-70 flex items-center gap-2" style={{ color: '#f97316' }}>
                                            <Banknote className="h-3 w-3" /> To Pay
                                        </h3>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] opacity-60">Total Freight</span>
                                                <span className="text-sm font-black" style={{ color: 'var(--theme-text-main)' }}>₹{(data.summary?.toPay?.totalFreight || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] opacity-60">Commission Received</span>
                                                <span className="text-sm font-black text-emerald-500">₹{(data.summary?.toPay?.received || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] opacity-60">Pending (Due Admin)</span>
                                                <span className="text-sm font-black text-rose-500">₹{(data.summary?.toPay?.pending || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Consignor Section */}
                                    <div className="p-5 rounded-2xl border flex flex-col gap-3" style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-2" style={{ color: 'var(--theme-text-muted)' }}>
                                            <DollarSign className="h-3 w-3" /> Consignor
                                        </h3>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] opacity-60">Total Revenue</span>
                                                <span className="text-sm font-black text-emerald-500">₹{(data.summary?.consignor?.totalRevenue || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] opacity-60">Outstanding</span>
                                                <span className="text-sm font-black text-rose-500">₹{(data.summary?.consignor?.totalOutstanding || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Driver Section */}
                                    <div className="p-5 rounded-2xl border flex flex-col gap-3" style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-2" style={{ color: 'var(--theme-text-muted)' }}>
                                            <Truck className="h-3 w-3" /> Driver
                                        </h3>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] opacity-60">Expenses</span>
                                                <span className="text-sm font-black" style={{ color: 'var(--theme-text-main)' }}>₹{(data.summary?.driver?.expenses || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] opacity-60">Net Outstanding</span>
                                                <span className="text-sm font-black text-sky-500">₹{(data.summary?.driver?.netOutstanding || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Consignor Ledgers */}
                                    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <div className="px-6 py-4 border-b flex justify-between items-center gap-4 flex-wrap" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--theme-text-main)' }}>
                                                <div className="w-1.5 h-4 rounded-full bg-emerald-500"></div>
                                                Consignor Receivables
                                            </h3>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search consignor..."
                                                    value={consignorLedgerSearch}
                                                    onChange={(e) => setConsignorLedgerSearch(e.target.value)}
                                                    className="block w-full max-w-xs rounded-xl text-xs px-3 py-2 border focus:outline-none transition-all duration-300"
                                                    style={inputStyle}
                                                />
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto max-h-96">
                                            <table className="min-w-full divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                                <thead className="sticky top-0" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Consignor</th>
                                                        <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Received</th>
                                                        <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Balance</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                                                    {data.consignorBalances?.filter(item => !consignorLedgerSearch || item.consignorName?.toLowerCase().includes(consignorLedgerSearch.toLowerCase())).map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold" style={{ color: 'var(--theme-text-main)' }}>{item.consignorName}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-right font-medium text-emerald-500">₹{item.totalReceived?.toLocaleString()}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-right font-black text-rose-500">₹{item.totalOutstanding?.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    {(!data.consignorBalances || data.consignorBalances.filter(item => !consignorLedgerSearch || item.consignorName?.toLowerCase().includes(consignorLedgerSearch.toLowerCase())).length === 0) && (
                                                        <tr><td colSpan="3" className="text-center py-6 text-xs opacity-50" style={{ color: 'var(--theme-text-muted)' }}>No data found matching filter</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Driver Payables */}
                                    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <div className="px-6 py-4 border-b flex justify-between items-center gap-4 flex-wrap" style={{ backgroundColor: 'rgba(244, 63, 94, 0.05)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--theme-text-main)' }}>
                                                <div className="w-1.5 h-4 rounded-full bg-rose-500"></div>
                                                Driver Payables
                                            </h3>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search driver..."
                                                    value={driverPayableSearch}
                                                    onChange={(e) => setDriverPayableSearch(e.target.value)}
                                                    className="block w-full max-w-xs rounded-xl text-xs px-3 py-2 border focus:outline-none transition-all duration-300"
                                                    style={inputStyle}
                                                />
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto max-h-96">
                                            <table className="min-w-full divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                                <thead className="sticky top-0" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Driver</th>
                                                        <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Payable</th>
                                                        <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Balance</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                                                    {data.driverLedger?.filter(item => !driverPayableSearch || item.driverName?.toLowerCase().includes(driverPayableSearch.toLowerCase()) || item.vehicleNumber?.toLowerCase().includes(driverPayableSearch.toLowerCase())).map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-xs" style={{ color: 'var(--theme-text-main)' }}>
                                                                <div className="font-bold">{item.driverName}</div>
                                                                <div className="opacity-50 mt-0.5">{item.vehicleNumber}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-right font-medium" style={{ color: 'var(--theme-text-main)' }}>₹{item.totalPayable?.toLocaleString()}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-right font-black text-rose-500">₹{item.balance?.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    {(!data.driverLedger || data.driverLedger.filter(item => !driverPayableSearch || item.driverName?.toLowerCase().includes(driverPayableSearch.toLowerCase()) || item.vehicleNumber?.toLowerCase().includes(driverPayableSearch.toLowerCase())).length === 0) && (
                                                        <tr><td colSpan="3" className="text-center py-6 text-xs opacity-50" style={{ color: 'var(--theme-text-muted)' }}>No data found matching filter</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Overall Commission Summary - Unified View */}
                                <div className="mt-8 p-6 rounded-3xl border shadow-lg" style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(14, 165, 233, 0.2)', borderLeftWidth: '6px' }}>
                                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <LayoutDashboard className="h-5 w-5 text-sky-500" />
                                        Overall Commission Summary (Consolidated)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Total Received</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-emerald-500">₹{((data.summary?.commission?.received || 0) + (data.summary?.toPay?.received || 0)).toLocaleString()}</span>
                                                <span className="text-[10px] opacity-40 font-bold">(Regular + To Pay)</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Total Pending (Market)</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-rose-500">₹{((data.summary?.commission?.pending || 0) + (data.summary?.toPay?.pending || 0)).toLocaleString()}</span>
                                                <span className="text-[10px] opacity-40 font-bold">(Uncollected)</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(14, 165, 233, 0.05)' }}>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">Gross Commission Value</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-sky-500">
                                                    ₹{(
                                                        (data.summary?.commission?.received || 0) +
                                                        (data.summary?.toPay?.received || 0) +
                                                        (data.summary?.commission?.pending || 0) +
                                                        (data.summary?.toPay?.pending || 0)
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Projections & Analytics View */}
                        {activeTab === 'projections' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Top Row - KPIs */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 rounded-3xl border shadow-sm flex flex-col justify-between" style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Total projected revenue</p>
                                            <h2 className="text-3xl font-black text-emerald-500">₹{(data?.summary?.consignor?.totalRevenue || 0).toLocaleString()}</h2>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-500/80">
                                            <TrendingUp className="h-3 w-3" />
                                            <span>Current Cycle Growth: 12%</span>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-3xl border shadow-sm flex flex-col justify-between" style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Outstanding collections</p>
                                            <h2 className="text-3xl font-black text-rose-500">₹{(data?.summary?.consignor?.totalOutstanding || 0).toLocaleString()}</h2>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-rose-500/80">
                                            <AlertCircle className="h-3 w-3" />
                                            <span>Target Recovery: 85%</span>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-3xl border shadow-sm flex flex-col justify-between" style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Active Trip Count</p>
                                            <h2 className="text-3xl font-black text-sky-500">{(data?.profitability?.length || 0).toLocaleString()}</h2>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-sky-500/80">
                                            <Truck className="h-3 w-3" />
                                            <span>Fleet Utilization: High</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Second Row - Main Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Daily Trips Bar Chart */}
                                    <div className="p-6 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-4 rounded-full bg-sky-500"></div>
                                                Daily Trip Volume
                                            </h3>
                                        </div>
                                        <div className="h-72 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={
                                                    data?.profitability?.reduce((acc, trip) => {
                                                        const date = new Date(trip.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                                                        const existing = acc.find(a => a.name === date);
                                                        if (existing) existing.trips += 1;
                                                        else acc.push({ name: date, trips: 1 });
                                                        return acc;
                                                    }, []).slice(-10) || []
                                                }>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'var(--theme-text-muted)' }} />
                                                    <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'var(--theme-text-muted)' }} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: 'var(--theme-bg-sidebar)', borderRadius: '12px', borderColor: 'rgba(255,255,255,0.1)', fontSize: '12px' }}
                                                        itemStyle={{ color: 'var(--theme-primary)' }}
                                                    />
                                                    <Bar dataKey="trips" fill="var(--theme-primary)" radius={[4, 4, 0, 0]} barSize={24} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Revenue vs Outstanding */}
                                    <div className="p-6 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-4 rounded-full bg-emerald-500"></div>
                                                Revenue vs Outstanding
                                            </h3>
                                        </div>
                                        <div className="h-72 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={[
                                                    { name: 'Total Cycle', revenue: data?.summary?.consignor?.totalRevenue || 0, outstanding: data?.summary?.consignor?.totalOutstanding || 0 }
                                                ]}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: 'var(--theme-bg-sidebar)', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                                                    />
                                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                                                    <Bar name="Revenue" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={50} />
                                                    <Bar name="Outstanding" dataKey="outstanding" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={50} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Third Row - Distribution Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Fleet Utilization Donut */}
                                    <div className="p-6 rounded-3xl border shadow-sm flex flex-col" style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <PieChart className="h-4 w-4 text-primary" /> Fleet Utilization
                                        </h3>
                                        <div className="flex-1 h-64 flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RePieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'On Trip', value: data?.profitability?.length || 70, color: '#10b981' },
                                                            { name: 'Available', value: 20, color: '#0ea5e9' },
                                                            { name: 'Maintenance', value: 10, color: '#f43f5e' }
                                                        ]}
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {[
                                                            { name: 'On Trip', value: 70, color: '#10b981' },
                                                            { name: 'Available', value: 20, color: '#0ea5e9' },
                                                            { name: 'Maintenance', value: 10, color: '#f43f5e' }
                                                        ].map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                                                </RePieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mt-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 mb-1"></div>
                                                <span className="text-[10px] opacity-60">Active</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-sky-500 mb-1"></div>
                                                <span className="text-[10px] opacity-60">Idle</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-rose-500 mb-1"></div>
                                                <span className="text-[10px] opacity-60">Down</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Top Consignors Horizontal Bar */}
                                    <div className="lg:col-span-2 p-6 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-emerald-500" /> Top Consignors by Revenue
                                        </h3>
                                        <div className="h-72 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    layout="vertical"
                                                    data={data?.consignorBalances?.sort((a, b) => b.totalInvoiced - a.totalInvoiced).slice(0, 5) || []}
                                                    margin={{ left: 20 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} />
                                                    <YAxis dataKey="consignorName" type="category" fontSize={10} axisLine={false} tickLine={false} width={100} tick={{ fill: 'var(--theme-text-main)' }} />
                                                    <Tooltip
                                                        formatter={(value) => `₹${value.toLocaleString()}`}
                                                        contentStyle={{ backgroundColor: 'var(--theme-bg-sidebar)', borderRadius: '12px' }}
                                                    />
                                                    <Bar name="Revenue" dataKey="totalInvoiced" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Row - Driver Leaderboard */}
                                <div className="rounded-3xl border overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <div className="px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: 'rgba(14, 165, 233, 0.05)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-sky-500" /> Driver Performance Leaderboard
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest opacity-50">Driver</th>
                                                    <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest opacity-50">Vehicle</th>
                                                    <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest opacity-50">Completed Trips</th>
                                                    <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest opacity-50">Total Revenue Contribution</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                                                {data?.driverLedger?.sort((a, b) => b.totalTrips - a.totalTrips).slice(0, 5).map((driver, idx) => (
                                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-500 font-bold text-xs">
                                                                    {idx + 1}
                                                                </div>
                                                                <span className="text-xs font-bold">{driver.driverName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center whitespace-nowrap text-xs opacity-60">{driver.vehicleNumber}</td>
                                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                                            <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-500 text-[10px] font-black uppercase tracking-widest">
                                                                {driver.totalTrips} Trips
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right whitespace-nowrap text-xs font-black text-emerald-500">
                                                            ₹{(driver.totalPayable || 0).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Milestone Details Modal */}
                {milestoneModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMilestoneModalOpen(false)}></div>
                        <div
                            className="relative z-10 w-full max-w-5xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors duration-500"
                            style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--theme-text-main)' }}>
                                        {selectedMilestoneTitle}
                                    </h3>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search Driver/Vehicle..."
                                            value={milestoneSearch}
                                            onChange={(e) => setMilestoneSearch(e.target.value)}
                                            className="text-xs rounded-xl border pl-3 pr-8 py-1.5 focus:outline-none transition-all w-48 focus:w-64"
                                            style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                        />
                                        {milestoneSearch && (
                                            <button onClick={() => setMilestoneSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setMilestoneModalOpen(false)}
                                    className="p-2 rounded-xl transition-colors hover:bg-white/5 opacity-50 hover:opacity-100"
                                    style={{ color: 'var(--theme-text-main)' }}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 flex-1 overflow-y-auto">
                                {milestoneLoading ? (
                                    <div className="flex justify-center items-center h-32">
                                        <div className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full" style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }}></div>
                                    </div>
                                ) : (
                                    <>
                                        {milestoneDetails && milestoneDetails.length > 0 ? (
                                            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                                <table className="min-w-full divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                                    <thead style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Date</th>
                                                            <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Driver / Lorry</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Advance</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>To Pay</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Consignor Bal</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Bal Payable</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Bal Paid</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Bal Recovered</th>
                                                            <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                                                        {milestoneDetails
                                                            .filter(trip =>
                                                                (trip.driverName?.toLowerCase() || '').includes(milestoneSearch.toLowerCase()) ||
                                                                (trip.vehicleNumber?.toLowerCase() || '').includes(milestoneSearch.toLowerCase()) ||
                                                                (trip.lorryName?.toLowerCase() || '').includes(milestoneSearch.toLowerCase())
                                                            )
                                                            .map((trip, idx) => (
                                                                <tr key={idx} className="hover:bg-white/5 transition-all">
                                                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium" style={{ color: 'var(--theme-text-main)' }}>
                                                                        {new Date(trip.tripDateTime).toLocaleDateString()}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-xs" style={{ color: 'var(--theme-text-main)' }}>
                                                                        <div className="font-bold">{trip.driverName || 'Unknown'}</div>
                                                                        <div className="opacity-50 mt-0.5">{trip.lorryName || trip.vehicleNumber}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-right font-medium text-amber-500">
                                                                        ₹{trip.driverAdvance?.toLocaleString() || 0}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-right font-bold text-sky-500">
                                                                        ₹{trip.toPayAmount?.toLocaleString() || 0}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-right font-bold text-orange-500">
                                                                        ₹{trip.balanceReceivable?.toLocaleString() || 0}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-right font-black text-rose-500">
                                                                        ₹{trip.balancePayableToDriver?.toLocaleString() || 0}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-right font-bold text-emerald-500">
                                                                        ₹{trip.driverBalancePaid?.toLocaleString() || 0}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-right font-black" style={{ color: 'var(--theme-primary)' }}>
                                                                        ₹{trip.driverBalanceCollectedAmount?.toLocaleString() || 0}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-center">
                                                                        <span className="px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-full" style={{ backgroundColor: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                                                                            {trip.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 rounded-xl border border-dashed text-xs opacity-50" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-muted)' }}>
                                                No trips found for this milestone matching your current filters.
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                <button
                                    type="button"
                                    onClick={() => setMilestoneModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:bg-white/5"
                                    style={{ color: 'var(--theme-text-muted)' }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>)}

            {/* Hand Loan Recover Modal */}
            {recoverModalOpen && selectedLoan && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div
                        className="rounded-2xl w-full max-w-sm overflow-hidden border shadow-2xl"
                        style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--theme-text-main)' }}>Record Payment</h2>
                                <button onClick={() => setRecoverModalOpen(false)} className="opacity-50 hover:opacity-100 transition-opacity">
                                    <X className="w-5 h-5" style={{ color: 'var(--theme-text-main)' }} />
                                </button>
                            </div>
                            <div className="text-xs pt-1 opacity-70" style={{ color: 'var(--theme-text-muted)' }}>
                                For {selectedLoan.driverName} • Pending: ₹{selectedLoan.driverBalancePendingAmount?.toLocaleString()}
                            </div>
                        </div>

                        <form onSubmit={handleRecoverSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Payment Amount (₹)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={selectedLoan.driverBalancePendingAmount || 9999999}
                                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-opacity-50 transition-all font-medium text-sm"
                                    style={{ backgroundColor: 'var(--theme-bg-main)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                    value={recoverData.amount}
                                    onChange={(e) => setRecoverData({ ...recoverData, amount: e.target.value })}
                                    placeholder="Enter amount received..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Date Received</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-opacity-50 transition-all text-sm"
                                    style={{ backgroundColor: 'var(--theme-bg-main)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                    value={recoverData.date}
                                    onChange={(e) => setRecoverData({ ...recoverData, date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Notes (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-opacity-50 transition-all text-sm resize-none"
                                    style={{ backgroundColor: 'var(--theme-bg-main)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                                    rows="2"
                                    value={recoverData.note}
                                    onChange={(e) => setRecoverData({ ...recoverData, note: e.target.value })}
                                    placeholder="e.g. Received via GPay"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setRecoverModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/5"
                                    style={{ color: 'var(--theme-text-muted)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_4px_15px_-3px_var(--theme-primary-glow)] hover:shadow-[0_6px_20px_-3px_var(--theme-primary-glow)] hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                                    style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Save Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogisticsReports;
