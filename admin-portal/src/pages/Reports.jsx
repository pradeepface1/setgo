
import React, { useEffect, useState } from 'react';
import { tripService } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, X, FileText, Clock, Map, DollarSign, Activity } from 'lucide-react';
import TripList from '../components/trips/TripList';

import LogisticsReports from './LogisticsReports';

const Reports = () => {
    const { currentVertical } = useSettings();

    if (currentVertical === 'LOGISTICS') {
        return <LogisticsReports />;
    }

    const [stats, setStats] = useState(null);

    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [tripData, reportsData] = await Promise.all([
                    tripService.getTripStats(currentVertical),
                    tripService.getReports(currentVertical)
                ]);
                setStats(tripData);
                setReports(reportsData);
            } catch (err) {
                setError('Failed to load statistics: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [currentVertical]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-jubilant-600" /></div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;

    // Prepare data for charts
    const totalTrips = stats ? (stats.pending + stats.assigned + (stats.accepted || 0) + (stats.started || 0) + stats.completed + stats.cancelled) : 0;

    const pieData = [
        { name: 'Pending', value: stats.pending, color: '#F59E0B' }, // Yellow/Amber
        { name: 'Assigned', value: stats.assigned, color: '#6B7280' }, // Gray
        { name: 'Started', value: stats.started || 0, color: '#F97316' }, // Orange
        { name: 'Completed', value: stats.completed, color: '#10B981' }, // Green
        { name: 'Cancelled', value: stats.cancelled, color: '#EF4444' } // Red
    ].map(item => ({
        ...item,
        percentage: totalTrips > 0 ? ((item.value / totalTrips) * 100).toFixed(1) : 0
    }));

    const reportMetrics = [
        { label: 'Total Kms', value: `${reports?.totalKm || 0} km`, icon: Map, color: 'bg-blue-500' },
        // ... (lines 49-55 remain same but need context for replace)
        { label: 'Total Hours', value: `${reports?.totalHours || 0} hrs`, icon: Clock, color: 'bg-indigo-500' },
        { label: 'Toll/Parking', value: `₹${reports?.tollParking || 0}`, icon: DollarSign, color: 'bg-green-500' },
        { label: 'Permit Charges', value: `₹${reports?.permit || 0}`, icon: FileText, color: 'bg-purple-500' },
        { label: 'Extra Kms', value: `${reports?.extraKm || 0} km`, icon: Activity, color: 'bg-orange-500' },
        { label: 'Extra Hours', value: `${reports?.extraHours || 0} hrs`, icon: Clock, color: 'bg-rose-500' },
    ];

    return (
        <div className="space-y-8">
            {/* ... (lines 59-179) ... */}
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
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
                    className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow text-left ${selectedStatus === 'ASSIGNED' ? 'ring-2 ring-gray-500' : ''}`}
                >
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-md bg-gray-500 p-3">
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
                    onClick={() => setSelectedStatus('STARTED')}
                    className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow text-left ${selectedStatus === 'STARTED' ? 'ring-2 ring-orange-500' : ''}`}
                >
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-md bg-orange-500 p-3">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Started</dt>
                                    <dd className="text-3xl font-semibold text-gray-900">{stats.started || 0}</dd>
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
            <div className="grid grid-cols-1 gap-6">
                {/* Trip Status Chart */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Trip Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                    return percent > 0 ? `${(percent * 100).toFixed(0)}%` : '';
                                }}
                                labelLine={false}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]} />
                            <Legend
                                payload={pieData.map(item => ({
                                    id: item.name,
                                    type: 'square',
                                    value: `${item.name} (${item.percentage}%)`,
                                    color: item.color
                                }))}
                            />
                        </PieChart>
                    </ResponsiveContainer>
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
