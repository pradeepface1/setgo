import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Building, AlertCircle } from 'lucide-react';
import { organizationService } from '../services/api';
import { useSettings } from '../context/SettingsContext';

const Organizations = () => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [error, setError] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        displayName: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        timezone: 'Asia/Kolkata',
        verticals: ['TAXI']
    });

    const { currentVertical } = useSettings();

    const fetchOrganizations = async () => {
        try {
            const data = await organizationService.getAll(currentVertical);
            setOrganizations(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrganizations();
    }, [currentVertical]);

    const handleOpenModal = (org = null) => {
        if (org) {
            setSelectedOrg(org);
            setFormData({
                name: org.name,
                code: org.code,
                displayName: org.displayName,
                contactEmail: org.contactEmail,
                contactPhone: org.contactPhone,
                address: org.address || '',
                timezone: org.settings?.timezone || 'Asia/Kolkata',
                verticals: org.verticals || ['TAXI']
            });
        } else {
            setSelectedOrg(null);
            setFormData({
                name: '',
                code: '',
                displayName: '',
                contactEmail: '',
                contactPhone: '',
                address: '',
                timezone: 'Asia/Kolkata',
                verticals: [currentVertical] // Auto-assign current vertical
            });
        }
        setIsModalOpen(true);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedOrg) {
                // Keep existing verticals but ensure current one is there? 
                // Or just trust formData? 
                // If editing, we probably shouldn't remove other verticals if it's multi-vertical.
                // But the requirement is strict segregation.
                // Let's assume we just save whatever is in formData.
                await organizationService.update(selectedOrg._id, {
                    ...formData,
                    settings: { timezone: formData.timezone },
                    verticals: [currentVertical] // Enforce current vertical on update? Or keep existing?
                    // User asked to REMOVE the button, implying automatic assignment.
                    // If I edit a Taxi org while in Logistics view, what happens?
                    // I shouldn't be able to SEE a Taxi org in Logistics view.
                    // So I must be in Taxi view to edit a Taxi org. 
                    // So enforcing [currentVertical] is safe and correct for strict segregation.
                });
            } else {
                await organizationService.create({
                    ...formData,
                    settings: { timezone: formData.timezone },
                    verticals: [currentVertical]
                });
            }
            fetchOrganizations();
            setIsModalOpen(false);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
            try {
                await organizationService.delete(id);
                fetchOrganizations();
            } catch (err) {
                alert(err.message);
            }
        }
    };

    const filteredOrgs = organizations.filter(org =>
        org.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Organizations</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-jubilant-600 text-black px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-jubilant-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Add Organization
                </button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-jubilant-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {error && !isModalOpen && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Organizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-gray-500">Loading organizations...</p>
                ) : filteredOrgs.length === 0 ? (
                    <p className="text-gray-500">No organizations found.</p>
                ) : (
                    filteredOrgs.map((org) => (
                        <div key={org._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-jubilant-50 rounded-lg">
                                    <Building className="w-6 h-6 text-jubilant-600" />
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${org.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {org.status}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-800 mb-1">{org.displayName}</h3>
                            <p className="text-sm text-gray-500 mb-4 font-mono">{org.code}</p>

                            <div className="space-y-2 text-sm text-gray-600 mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Email:</span> {org.contactEmail}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Phone:</span> {org.contactPhone}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => handleOpenModal(org)}
                                    className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(org._id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {selectedOrg ? 'Edit Organization' : 'New Organization'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 tex-sm">
                                    <AlertCircle className="w-5 h-5" />
                                    {error}
                                </div>
                            )}

                            {!selectedOrg && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-jubilant-500"
                                            value={formData.displayName} // Use displayName for the input value
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                // Update both displayName (raw) and name (slug)
                                                setFormData({
                                                    ...formData,
                                                    displayName: val,
                                                    name: val.toLowerCase().replace(/\s+/g, '-')
                                                });
                                            }}
                                            placeholder="e.g. ABC Transport"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-jubilant-500"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            placeholder="e.g. ABC001"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-jubilant-500"
                                        value={formData.contactEmail}
                                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                    <input
                                        type="tel"
                                        required
                                        maxLength={10}
                                        pattern="[0-9]{10}"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-jubilant-500"
                                        value={formData.contactPhone}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setFormData({ ...formData, contactPhone: val });
                                        }}
                                        placeholder="Mobile Number (10 digits)"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-jubilant-500"
                                    rows="2"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>



                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-jubilant-600 text-black rounded-lg hover:bg-jubilant-700 transition-colors"
                                >
                                    {selectedOrg ? 'Save Changes' : 'Create Organization'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );
};

export default Organizations;
