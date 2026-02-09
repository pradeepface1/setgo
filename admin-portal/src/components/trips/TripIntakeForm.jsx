import React, { useState } from 'react';
import { tripService } from '../../services/api';
import { Clipboard, Send, Loader2 } from 'lucide-react';

// Vehicle categories and subcategories mapping
const VEHICLE_OPTIONS = {
    'Sedan Regular': ['Swift Desire', 'Etios', 'Aura'],
    'Sedan Premium': ['Benz E class', 'BMW 5 series', 'Audi A6'],
    'Sedan Premium+': ['Benz S class', 'BMW 7 series'],
    'SUV Regular': ['Crysta', 'Ertiga'],
    'SUV Premium': ['Hycross', 'Fortuner'],
    'Tempo Traveller': ['12 seater basic'],
    'Force Premium': ['Urbania 16 seater'],
    'Bus': ['20 Seaters', '25 Seaters', '33 Seaters', '40 Seaters', '50 Seaters'],
    'High End Coaches': ['Commuter', 'Vellfire', 'Benz Van']
};

const TripIntakeForm = ({ onTripCreated }) => {
    const [mode, setMode] = useState('PARSER'); // 'PARSER' or 'MANUAL'
    const [rawText, setRawText] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleParse = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await tripService.parseTrip(rawText);
            // Ensure date object for form if valid
            if (data.tripDateTime) {
                data.tripDateTime = new Date(data.tripDateTime).toISOString().slice(0, 16);
            }
            setParsedData(data);
            setMode('MANUAL');
        } catch (err) {
            setError('Failed to parse text. Please try manual entry.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Prepare data for submission
            const submitData = {
                ...parsedData,
                requestSource: 'MANUAL' // Explicitly set request source for manual entries
            };

            console.log('BEFORE delete - submitData:', submitData);
            console.log('Has vehicleCategory?', !!submitData.vehicleCategory);
            console.log('Has vehicleSubcategory?', !!submitData.vehicleSubcategory);
            console.log('Has vehiclePreference?', !!submitData.vehiclePreference);

            // If using new category/subcategory system, remove legacy vehiclePreference
            if (submitData.vehicleCategory && submitData.vehicleSubcategory) {
                console.log('DELETING vehiclePreference');
                delete submitData.vehiclePreference;
            }

            console.log('AFTER delete - submitData:', submitData);
            console.log('Submitting trip with data:', submitData);
            // Form data handling would go here for manual overrides
            // For now using parsedData state directly
            const result = await tripService.createTrip(submitData);
            console.log('Trip created, response:', result);
            setRawText('');
            setParsedData(null);
            setMode('PARSER');
            if (onTripCreated) onTripCreated();
        } catch (err) {
            console.error('Trip creation error:', err);
            setError('Failed to create trip.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setParsedData(prev => ({ ...prev, [field]: value }));
    };

    const handleCategoryChange = (category) => {
        setParsedData(prev => ({
            ...prev,
            vehicleCategory: category,
            vehicleSubcategory: '' // Reset subcategory when category changes
        }));
    };

    return (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">New Trip Request</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setMode('PARSER')}
                        className={`px-3 py-1 rounded text-sm ${mode === 'PARSER' ? 'bg-jubilant-100 text-jubilant-600' : 'text-gray-500'}`}
                    >
                        Paste Text
                    </button>
                    <button
                        onClick={() => { setMode('MANUAL'); setParsedData({}); }}
                        className={`px-3 py-1 rounded text-sm ${mode === 'MANUAL' ? 'bg-jubilant-100 text-jubilant-600' : 'text-gray-500'}`}
                    >
                        Manual Entry
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                    {error}
                </div>
            )}

            {mode === 'PARSER' ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Paste WhatsApp/Email Request</label>
                        <textarea
                            rows={4}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-jubilant-500 focus:border-jubilant-500"
                            placeholder={`Request: John Doe\nDate: 2026-02-10 14:00\nPickup: Airport\nDrop: Hotel\nVehicle: Sedan`}
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleParse}
                        disabled={!rawText || loading}
                        className="flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-jubilant-600 hover:bg-jubilant-700 focus:outline-none disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Clipboard className="h-4 w-4 mr-2" />}
                        Parse Request
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Simple form fields for MVP */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                            <input
                                type="text"
                                value={parsedData?.customerName || ''}
                                onChange={e => handleInputChange('customerName', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                            <input
                                type="datetime-local"
                                value={parsedData?.tripDateTime || ''}
                                onChange={e => handleInputChange('tripDateTime', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Pickup</label>
                            <input
                                type="text"
                                value={parsedData?.pickupLocation || ''}
                                onChange={e => handleInputChange('pickupLocation', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Drop</label>
                            <input
                                type="text"
                                value={parsedData?.dropLocation || ''}
                                onChange={e => handleInputChange('dropLocation', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                required
                            />
                        </div>
                    </div>

                    {/* Vehicle Category and Subcategory */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Vehicle Category</label>
                            <select
                                value={parsedData?.vehicleCategory || ''}
                                onChange={e => handleCategoryChange(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                required
                            >
                                <option value="">Select Category</option>
                                {Object.keys(VEHICLE_OPTIONS).map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                            <select
                                value={parsedData?.vehicleSubcategory || ''}
                                onChange={e => handleInputChange('vehicleSubcategory', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                required
                                disabled={!parsedData?.vehicleCategory}
                            >
                                <option value="">Select Type</option>
                                {parsedData?.vehicleCategory && VEHICLE_OPTIONS[parsedData.vehicleCategory]?.map(subcategory => (
                                    <option key={subcategory} value={subcategory}>{subcategory}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setMode('PARSER')}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4 mr-2" />}
                            Create Trip
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default TripIntakeForm;
