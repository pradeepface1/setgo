import { useState, useEffect } from 'react';
import './TripCompletionModal.css';

function TripCompletionModal({ trip, onClose, onComplete }) {
    const [formData, setFormData] = useState({
        totalKm: '',
        totalHours: '',
        tollParking: '',
        permit: '',
        extraKm: '',
        extraHours: '',
        dripSheet: null
    });
    const [submitting, setSubmitting] = useState(false);

    // Auto-calculate hours on mount
    useEffect(() => {
        if (trip.startTime) {
            const start = new Date(trip.startTime);
            const end = new Date();
            const diffMs = end - start;
            const hours = (diffMs / (1000 * 60 * 60)).toFixed(2);
            setFormData(prev => ({ ...prev, totalHours: hours }));
        }
    }, [trip.startTime]);

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

        // Basic validation
        if (!formData.totalKm || !formData.totalHours) {
            alert('Please fill Compulsory fields: Total KMS and Total Hours');
            return;
        }

        setSubmitting(true);

        try {
            const data = new FormData();
            data.append('totalKm', formData.totalKm);
            data.append('totalHours', formData.totalHours);
            if (formData.tollParking) data.append('tollParking', formData.tollParking);
            if (formData.permit) data.append('permit', formData.permit);
            if (formData.extraKm) data.append('extraKm', formData.extraKm);
            if (formData.extraHours) data.append('extraHours', formData.extraHours);

            if (formData.dripSheet) {
                data.append('dripSheet', formData.dripSheet);
            }

            await onComplete(data);
        } catch (error) {
            console.error('Submission failed', error);
            alert('Failed to submit trip details: ' + (error.message || 'Unknown error'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Complete Trip Details</h3>
                    <button onClick={onClose} className="close-button">×</button>
                </div>

                <div className="trip-summary">
                    <p><strong>Customer:</strong> {trip.customerName}</p>
                    <p><strong>Route:</strong> {trip.pickupLocation} → {trip.dropLocation}</p>
                </div>

                <form onSubmit={handleSubmit} className="completion-form">
                    <div className="form-group compulsory">
                        <label>Total KMS *</label>
                        <input
                            type="text"
                            name="totalKm"
                            value={formData.totalKm}
                            onChange={handleChange}
                            placeholder="e.g. 150.5"
                            required
                        />
                    </div>

                    <div className="form-group compulsory">
                        <label>Total Hours *</label>
                        <input
                            type="text"
                            name="totalHours"
                            value={formData.totalHours}
                            onChange={handleChange}
                            placeholder="Auto-calculated"
                            required
                            readOnly
                            style={{ backgroundColor: '#f3f4f6' }}
                        />
                    </div>

                    <div className="separator">Optional Details</div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Toll / Parking</label>
                            <input
                                type="text"
                                name="tollParking"
                                value={formData.tollParking}
                                onChange={handleChange}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="form-group">
                            <label>Permit</label>
                            <input
                                type="text"
                                name="permit"
                                value={formData.permit}
                                onChange={handleChange}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Extra KMS</label>
                            <input
                                type="text"
                                name="extraKm"
                                value={formData.extraKm}
                                onChange={handleChange}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="form-group">
                            <label>Extra Hours</label>
                            <input
                                type="text"
                                name="extraHours"
                                value={formData.extraHours}
                                onChange={handleChange}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Drip Sheet (Image) - Optional</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setFormData(prev => ({ ...prev, dripSheet: e.target.files[0] }));
                                }
                            }}
                            className="file-input"
                        />
                        <p className="help-text">Upload a photo of the completed trip sheet (JPEG/PNG)</p>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="submit-btn">
                            {submitting ? 'Completing...' : 'Submit & Complete'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TripCompletionModal;
