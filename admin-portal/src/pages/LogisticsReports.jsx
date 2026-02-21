import React, { useState, useEffect } from 'react';
import { reportsService, consignorService, tripService, organizationService } from '../services/api'; // Added organizationService
import { Download, Filter, TrendingUp, AlertCircle, Clock, Truck, DollarSign } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext'; // Added useAuth

const LogisticsReports = () => {
    const { user } = useAuth(); // Get user
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [consignors, setConsignors] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [organizations, setOrganizations] = useState([]); // Added organizations state
    const [filters, setFilters] = useState({ consignorId: '', driverId: '', organizationId: '' }); // Added organizationId

    useEffect(() => {
        console.log("LogisticsReports: User:", user);
        console.log("LogisticsReports: Role:", user?.role);
        console.log("LogisticsReports: Organizations:", organizations);
        loadFilters();
    }, [user]); // Reload if user changes (rare but good practice)

    useEffect(() => {
        fetchReports();
    }, [dateRange.start, dateRange.end, filters.consignorId, filters.driverId, filters.organizationId]); // Added organizationId dependency

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

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = {
                ...dateRange,
                ...filters
            };

            // Fetch Financials, Aging (for Consignors), and Operations (for Drivers) all at once
            const [financials, aging, ops] = await Promise.all([
                reportsService.getFinancials(params),
                reportsService.getAging(params),
                reportsService.getOperations(params)
            ]);

            setData({
                profitability: financials.profitability,
                commissionSummary: financials.commissionSummary,
                consignorBalances: aging.consignorBalances,
                driverLedger: ops.driverLedger
            });

        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!data) return;
        const wb = XLSX.utils.book_new();

        if (data.consignorBalances) {
            const ws = XLSX.utils.json_to_sheet(data.consignorBalances);
            XLSX.utils.book_append_sheet(wb, ws, 'Consignor Ledgers');
        }
        if (data.driverLedger) {
            const ws = XLSX.utils.json_to_sheet(data.driverLedger);
            XLSX.utils.book_append_sheet(wb, ws, 'Driver Payables');
        }
        if (data.profitability) {
            const ws = XLSX.utils.json_to_sheet(data.profitability);
            XLSX.utils.book_append_sheet(wb, ws, 'Trip Profitability');
        }

        XLSX.writeFile(wb, `Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
                <div className="flex flex-wrap gap-2 items-center">

                    {/* Organization Filter (Super Admin Only) */}
                    {user?.role === 'SUPER_ADMIN' ? (
                        <select
                            value={filters.organizationId}
                            onChange={(e) => setFilters(prev => ({ ...prev, organizationId: e.target.value }))}
                            className="bg-white border border-gray-300 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2"
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
                                className="bg-white border border-gray-300 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2"
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
                                className="bg-white border border-gray-300 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2"
                            >
                                <option value="">All Drivers</option>
                                {drivers.map(d => (
                                    <option key={d._id} value={d._id}>{d.name} ({d.vehicleNumber})</option>
                                ))}
                            </select>
                        </>
                    )}

                    <div className="flex gap-2 bg-white p-1 rounded-md border border-gray-300">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="bg-transparent border-none text-sm focus:ring-0 p-1"
                        />
                        <span className="text-gray-400 self-center">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="bg-transparent border-none text-sm focus:ring-0 p-1"
                        />
                        {(dateRange.start || dateRange.end) && (
                            <button
                                onClick={() => setDateRange({ start: '', end: '' })}
                                className="text-gray-500 hover:text-gray-700 p-1"
                                title="Clear Dates"
                            >
                                <Filter className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                </div>
            ) : data ? (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                            <p className="text-2xl font-bold text-green-600">
                                ₹{data.profitability?.reduce((sum, item) => sum + (item.totalHireValue || 0), 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                            <h3 className="text-sm font-medium text-gray-500">Gross Profit</h3>
                            <p className="text-2xl font-bold text-indigo-600">
                                ₹{data.profitability?.reduce((sum, item) => sum + (item.grossProfit || 0), 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                            <h3 className="text-sm font-medium text-gray-500">Expenses (Driver+Exp)</h3>
                            <p className="text-2xl font-bold text-red-500">
                                ₹{data.profitability?.reduce((sum, item) => sum + (item.expenses || 0) + (item.driverPayable || 0), 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
                            <h3 className="text-sm font-medium text-gray-500">Net Outstanding (In - Out)</h3>
                            <p className="text-2xl font-bold text-blue-500">
                                ₹{(
                                    (data.consignorBalances?.reduce((sum, i) => sum + i.totalOutstanding, 0) || 0) -
                                    (data.driverLedger?.reduce((sum, i) => sum + i.balance, 0) || 0)
                                ).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Consignor Ledgers */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                                <h3 className="text-lg font-medium text-green-900 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Consignor Ledgers (Receivables)
                                </h3>
                            </div>
                            <div className="overflow-x-auto max-h-96">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consignor</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Received</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.consignorBalances?.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {item.consignorName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                                                    ₹{item.totalReceived?.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600">
                                                    ₹{item.totalOutstanding?.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!data.consignorBalances || data.consignorBalances.length === 0) && (
                                            <tr><td colSpan="3" className="text-center py-4 text-gray-500">No data found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Driver Payables */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
                                <h3 className="text-lg font-medium text-red-900 flex items-center gap-2">
                                    <Truck className="h-5 w-5" />
                                    Driver Payables
                                </h3>
                            </div>
                            <div className="overflow-x-auto max-h-96">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payable</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.driverLedger?.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {item.driverName} <span className="text-gray-400 text-xs">({item.vehicleNumber})</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                                    ₹{item.totalPayable?.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600">
                                                    ₹{item.balance?.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!data.driverLedger || data.driverLedger.length === 0) && (
                                            <tr><td colSpan="3" className="text-center py-4 text-gray-500">No data found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Profitability Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Trip Profitability</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consignor</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hire Value</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost (Pay+Exp)</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Profit</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data.profitability?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(item.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.vehicleNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.consignorName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                                                ₹{item.totalHireValue?.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-500">
                                                ₹{(item.driverPayable + item.expenses)?.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-indigo-600">
                                                ₹{item.grossProfit?.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!data.profitability || data.profitability.length === 0) && (
                                        <tr><td colSpan="6" className="text-center py-4 text-gray-500">No data found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default LogisticsReports;
