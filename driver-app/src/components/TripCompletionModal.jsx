import { useState } from 'react';
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
            await onComplete(submissionData);
        } catch (error) {
            console.error('Submission failed', error);
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
                            placeholder="e.g. 8.5"
                            required
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
