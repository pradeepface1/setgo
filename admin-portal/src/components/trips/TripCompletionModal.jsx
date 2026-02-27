import { useState } from 'react';
import { tripService } from '../../services/api';
import './TripCompletionModal.css';

function TripCompletionModal({ trip, onClose, onComplete }) {
    const [formData, setFormData] = useState({
        totalKm: '',
        totalHours: '',
        tollParking: '',
        permit: '',
        extraKm: '',
        extraHours: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Allow only numbers and decimals
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!formData.totalKm || !formData.totalHours) {
            alert('Please fill Compulsory fields: Total KMS and Total Hours');
            return;
        }

        setSubmitting(true);
        // Convert strings to numbers
        const submissionData = {
            totalKm: parseFloat(formData.totalKm),
            totalHours: parseFloat(formData.totalHours),
            tollParking: formData.tollParking ? parseFloat(formData.tollParking) : 0,
            permit: formData.permit ? parseFloat(formData.permit) : 0,
            extraKm: formData.extraKm ? parseFloat(formData.extraKm) : 0,
            extraHours: formData.extraHours ? parseFloat(formData.extraHours) : 0
        };

        try {
            await tripService.completeTrip(trip._id, submissionData);
            if (onComplete) onComplete();
            onClose();
        } catch (error) {
            console.error('Submission failed', error);
            setError('Failed to complete trip. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-[9999]" onClick={onClose}>
            <div
                className="relative rounded-3xl shadow-2xl w-full max-w-md mx-4 border transition-colors duration-500 overflow-hidden"
                style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--theme-text-main)' }}>Complete Trip Details</h3>
                    <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity text-2xl font-light" style={{ color: 'var(--theme-text-main)' }}>×</button>
                </div>

                <div className="p-6">
                    <div className="mb-6 p-4 rounded-xl text-sm border shadow-sm transition-colors duration-500"
                        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}>
                        <p className="mb-1" style={{ color: 'var(--theme-text-muted)' }}>
                            <strong style={{ color: 'var(--theme-text-main)' }}>Customer:</strong> {trip.customerName}
                        </p>
                        <p style={{ color: 'var(--theme-text-muted)' }}>
                            <strong style={{ color: 'var(--theme-text-main)' }}>Route:</strong> {trip.pickupLocation} → {trip.dropLocation}
                        </p>
                    </div>

                    {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: 'var(--theme-text-muted)' }}>Total KMS *</label>
                                <input
                                    type="text"
                                    name="totalKm"
                                    value={formData.totalKm}
                                    onChange={handleChange}
                                    placeholder="e.g. 150.5"
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: 'var(--theme-text-muted)' }}>Total Hours *</label>
                                <input
                                    type="text"
                                    name="totalHours"
                                    value={formData.totalHours}
                                    onChange={handleChange}
                                    placeholder="e.g. 8.5"
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px flex-1 bg-white/5"></div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 px-2" style={{ color: 'var(--theme-text-main)' }}>Optional Details</span>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--theme-text-muted)' }}>Toll / Parking</label>
                                <input
                                    type="text"
                                    name="tollParking"
                                    value={formData.tollParking}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--theme-text-muted)' }}>Permit</label>
                                <input
                                    type="text"
                                    name="permit"
                                    value={formData.permit}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--theme-text-muted)' }}>Extra KMS</label>
                                <input
                                    type="text"
                                    name="extraKm"
                                    value={formData.extraKm}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--theme-text-muted)' }}>Extra Hours</label>
                                <input
                                    type="text"
                                    name="extraHours"
                                    value={formData.extraHours}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2 rounded-xl transition-all duration-300 border focus:outline-none"
                                    style={{
                                        backgroundColor: 'var(--theme-bg-card)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--theme-text-main)'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border rounded-xl text-sm font-bold transition-all hover:bg-white/5 active:scale-95"
                                style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--theme-text-main)' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`flex-[1.5] px-6 py-3 rounded-xl shadow-lg text-sm font-bold transition-all active:scale-95 hover:shadow-[0_0_20px_var(--theme-primary-glow)]`}
                                style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}
                            >
                                {submitting ? 'Completing...' : 'Submit & Complete'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default TripCompletionModal;;
