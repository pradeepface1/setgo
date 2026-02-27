
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
                <h1 className="text-2xl font-black tracking-tight transition-colors duration-500" style={{ color: 'var(--theme-text-main)' }}>Reports & Analytics</h1>
            </div>

            {/* Consolidated Report Section */}
            <div
                className="shadow-sm p-6 rounded-2xl border transition-colors duration-500"
                style={{
                    backgroundColor: 'var(--theme-bg-card)',
                    borderColor: 'rgba(255,255,255,0.05)'
                }}
            >
                <h2 className="text-sm font-black uppercase tracking-widest opacity-50 mb-6 transition-colors duration-500" style={{ color: 'var(--theme-text-main)' }}>Consolidated Operational Report</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {reportMetrics.map((metric, index) => (
                        <div
                            key={index}
                            className="rounded-xl p-4 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02]"
                            style={{ backgroundColor: 'var(--theme-bg-sidebar)' }}
                        >
                            <div className={`p-2 rounded-full ${metric.color} bg-opacity-10 mb-3`}>
                                <metric.icon className={`h-5 w-5 ${metric.color.replace('bg-', 'text-')}`} />
                            </div>
                            <dt className="text-[10px] font-bold uppercase tracking-widest opacity-50 transition-colors duration-500" style={{ color: 'var(--theme-text-muted)' }}>{metric.label}</dt>
                            <dd className="mt-1 text-xl font-black transition-colors duration-500" style={{ color: 'var(--theme-text-main)' }}>{metric.value}</dd>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
                {[
                    { status: 'PENDING', label: 'Pending', value: stats.pending, color: '#F59E0B', ring: 'ring-amber-500', svgPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { status: 'ASSIGNED', label: 'Assigned', value: stats.assigned, color: '#6B7280', ring: 'ring-gray-500', svgPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { status: 'STARTED', label: 'Started', value: stats.started || 0, color: '#F97316', ring: 'ring-orange-500', svgPath: 'M13 10V3L4 14h7v7l9-11h-7z' },
                    { status: 'COMPLETED', label: 'Completed', value: stats.completed, color: '#10B981', ring: 'ring-green-500', svgPath: 'M5 13l4 4L19 7' },
                    { status: 'CANCELLED', label: 'Cancelled', value: stats.cancelled, color: '#EF4444', ring: 'ring-red-500', svgPath: 'M6 18L18 6M6 6l12 12' },
                ].map(({ status, label, value, color, ring, svgPath }) => (
                    <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`overflow-hidden rounded-2xl border transition-all duration-300 text-left hover:scale-[1.02] ${selectedStatus === status ? `ring-2 ${ring}` : ''}`}
                        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="rounded-xl p-3" style={{ backgroundColor: `${color}20` }}>
                                        <svg className="h-6 w-6" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={svgPath} />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <dt className="text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>{label}</dt>
                                    <dd className="text-3xl font-black mt-0.5 tracking-tighter" style={{ color: 'var(--theme-text-main)' }}>{value}</dd>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6">
                {/* Trip Status Chart */}
                <div
                    className="shadow-sm rounded-2xl p-6 border transition-colors duration-500"
                    style={{
                        backgroundColor: 'var(--theme-bg-sidebar)',
                        borderColor: 'rgba(255,255,255,0.05)'
                    }}
                >
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-50 mb-6 transition-colors duration-500" style={{ color: 'var(--theme-text-main)' }}>Trip Status Distribution</h3>
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
                    <div
                        className="rounded-2xl border p-4 mb-4 flex items-center justify-between"
                        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                        <h2 className="text-sm font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-main)' }}>
                            {selectedStatus.charAt(0) + selectedStatus.slice(1).toLowerCase()} Trips
                        </h2>
                        <button
                            onClick={() => setSelectedStatus(null)}
                            className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--theme-text-main)' }}
                        >
                            <X className="h-4 w-4" />
                            Close
                        </button>
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
