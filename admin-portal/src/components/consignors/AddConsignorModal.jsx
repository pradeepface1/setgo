import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { consignorService, organizationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AddConsignorModal = ({ onClose, onConsignorAdded, consignorToEdit = null }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        gstin: '',
        organizationId: ''
    });
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (consignorToEdit) {
            setFormData({
                name: consignorToEdit.name || '',
                contactPerson: consignorToEdit.contactPerson || '',
                phone: consignorToEdit.phone || '',
                email: consignorToEdit.email || '',
                gstin: consignorToEdit.gstin || '',
                organizationId: consignorToEdit.organizationId?._id || consignorToEdit.organizationId || ''
            });
        }

        const fetchOrgs = async () => {
            if (user?.role === 'SUPER_ADMIN') {
                try {
                    const orgs = await organizationService.getAll();
                    setOrganizations(orgs);
                    if (!consignorToEdit && orgs.length > 0) {
                        setFormData(prev => ({ ...prev, organizationId: orgs[0]._id }));
                    }
                } catch (err) {
                    console.error("Failed to fetch organizations", err);
                }
            } else {
                setFormData(prev => ({ ...prev, organizationId: user.organizationId }));
            }
        };
        fetchOrgs();
    }, [consignorToEdit, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (consignorToEdit) {
                await consignorService.update(consignorToEdit._id, formData);
            } else {
                await consignorService.create(formData);
            }
            onConsignorAdded();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save consignor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-900">
                        {consignorToEdit ? 'Edit Consignor' : 'Add New Consignor'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Organization Hidden/Auto-handled */}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Consignor Name *</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="e.g., NT" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="e.g., 9876543210" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                            {loading ? 'Saving...' : (consignorToEdit ? 'Update Consignor' : 'Add Consignor')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddConsignorModal;
