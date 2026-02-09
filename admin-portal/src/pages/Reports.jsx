
import React, { useEffect, useState } from 'react';
import { tripService, sosService } from '../services/api';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, X, AlertTriangle, FileText, Clock, Map, DollarSign, Activity } from 'lucide-react';
import TripList from '../components/trips/TripList';

const Reports = () => {
    const [stats, setStats] = useState(null);
    const [sosStats, setSosStats] = useState(null);
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [tripData, sosData, reportsData] = await Promise.all([
                    tripService.getTripStats(),
                    sosService.getStats(),
                    tripService.getReports()
                ]);
                setStats(tripData);
                setSosStats(sosData);
                setReports(reportsData);
            } catch (err) {
                setError('Failed to load statistics: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-jubilant-600" /></div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;

    // Prepare data for chats
    const pieData = [
        { name: 'Pending', value: stats.pending, color: '#F59E0B' },
        { name: 'Assigned', value: stats.assigned, color: '#3B82F6' },
        { name: 'Completed', value: stats.completed, color: '#10B981' },
        { name: 'Cancelled', value: stats.cancelled, color: '#EF4444' }
    ];

    const sosChartData = [
        { name: 'Open', value: sosStats?.open || 0, fill: '#EF4444' },
        { name: 'Resolved', value: sosStats?.resolved || 0, fill: '#10B981' },
        { name: 'False Alarm', value: sosStats?.false_alarm || 0, fill: '#6B7280' }
    ];

    const reportMetrics = [
        { label: 'Total Kms', value: `${reports?.totalKm || 0} km`, icon: Map, color: 'bg-blue-500' },
        { label: 'Total Hours', value: `${reports?.totalHours || 0} hrs`, icon: Clock, color: 'bg-indigo-500' },
        { label: 'Toll/Parking', value: `₹${reports?.tollParking || 0}`, icon: DollarSign, color: 'bg-green-500' },
        { label: 'Permit Charges', value: `₹${reports?.permit || 0}`, icon: FileText, color: 'bg-purple-500' },
        { label: 'Extra Kms', value: `${reports?.extraKm || 0} km`, icon: Activity, color: 'bg-orange-500' },
        { label: 'Extra Hours', value: `${reports?.extraHours || 0} hrs`, icon: Clock, color: 'bg-rose-500' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
            </div>

            {/* Consolidated Report Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Consolidated Operational Report</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {reportMetrics.map((metric, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 flex flex-col items-center text-center hover:bg-gray-100 transition-colors">
                            <div className={`p-2 rounded-full ${metric.color} bg-opacity-10 mb-2`}>
                                <metric.icon className={`h-5 w-5 ${metric.color.replace('bg-', 'text-')}`} />
                            </div>
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{metric.label}</dt>
                            <dd className="mt-1 text-lg font-bold text-gray-900">{metric.value}</dd>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <button
                    onClick={() => setSelectedStatus('PENDING')}
                    className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow text-left ${selectedStatus === 'PENDING' ? 'ring-2 ring-yellow-500' : ''}`}
                >
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-md bg-yellow-500 p-3">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                                    <dd className="text-3xl font-semibold text-gray-900">{stats.pending}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setSelectedStatus('ASSIGNED')}
                    className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow text-left ${selectedStatus === 'ASSIGNED' ? 'ring-2 ring-blue-500' : ''}`}
                >
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-md bg-blue-500 p-3">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Assigned</dt>
                                    <dd className="text-3xl font-semibold text-gray-900">{stats.assigned}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setSelectedStatus('COMPLETED')}
                    className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow text-left ${selectedStatus === 'COMPLETED' ? 'ring-2 ring-green-500' : ''}`}
                >
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-md bg-green-500 p-3">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                                    <dd className="text-3xl font-semibold text-gray-900">{stats.completed}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setSelectedStatus('CANCELLED')}
                    className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow text-left ${selectedStatus === 'CANCELLED' ? 'ring-2 ring-red-500' : ''}`}
                >
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-md bg-red-500 p-3">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Cancelled</dt>
                                    <dd className="text-3xl font-semibold text-gray-900">{stats.cancelled}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </button>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trip Status Chart */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Trip Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* SOS Alerts Chart */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="text-lg font-medium leading-6 text-gray-900">SOS Alert Distribution</h3>
                    </div>
                    {sosStats ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={sosChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value">
                                    {sosChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            No SOS Data
                        </div>
                    )}
                </div>
            </div>

            {/* Filtered Trip List */}
            {selectedStatus && (
                <div className="mt-6">
                    <div className="bg-white shadow rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {selectedStatus.charAt(0) + selectedStatus.slice(1).toLowerCase()} Trips
                            </h2>
                            <button
                                onClick={() => setSelectedStatus(null)}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
                            >
                                <X className="h-5 w-5" />
                                Close
                            </button>
                        </div>
                    </div>
                    <TripList
                        statusFilter={selectedStatus}
                        title={`${selectedStatus.charAt(0) + selectedStatus.slice(1).toLowerCase()} Trips`}
                    />
                </div>
            )}
        </div>
    );
};

export default Reports;
