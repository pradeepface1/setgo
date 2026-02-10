import React from 'react';
import TripList from '../components/trips/TripList';

const Trips = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Trips</h1>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <TripList
                    statusFilter={['ASSIGNED', 'ACCEPTED', 'STARTED', 'COMPLETED', 'CANCELLED']}
                    title="Assigned & Past Trips"
                />
            </div>
        </div>
    );
};

export default Trips;
