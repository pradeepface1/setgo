import React, { useState } from 'react';
import TripList from '../components/trips/TripList';
import LogisticsTripForm from '../components/trips/LogisticsTripForm';
import { useSettings } from '../context/SettingsContext';
import { Plus } from 'lucide-react';

const Trips = () => {
    const { currentVertical } = useSettings();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleTripCreated = () => {
        setRefreshTrigger(prev => prev + 1);
        setShowCreateModal(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Trips</h1>

                {/* Only show Create button for Logistics for now, or if needed for Taxi */}
                {currentVertical === 'LOGISTICS' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-jubilant-600 hover:bg-jubilant-700 focus:outline-none"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Trip
                    </button>
                )}
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <TripList
                    statusFilter={['ASSIGNED', 'ACCEPTED', 'STARTED', 'COMPLETED', 'CANCELLED', 'LOADING', 'IN_TRANSIT', 'UNLOADED', 'PAYMENT_PENDING']}
                    title="All Trips"
                    refreshTrigger={refreshTrigger}
                />
            </div>

            {showCreateModal && currentVertical === 'LOGISTICS' && (
                <LogisticsTripForm
                    onClose={() => setShowCreateModal(false)}
                    onTripCreated={handleTripCreated}
                />
            )}
        </div>
    );
};

export default Trips;
