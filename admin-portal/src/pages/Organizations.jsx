import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Building, AlertCircle, Upload } from 'lucide-react';
import { organizationService } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

const Organizations = () => {
    const { user, login } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [error, setError] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const logoInputRef = useRef(null);

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
            setLogoFile(null);
            setLogoPreview(org.logo ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}/uploads/org-logos/org-${org._id}.jpg` : null);
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
                verticals: [currentVertical]
            });
            setLogoFile(null);
            setLogoPreview(null);
        }
        setIsModalOpen(true);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let savedOrg;
            if (selectedOrg) {
                savedOrg = await organizationService.update(selectedOrg._id, {
                    ...formData,
                    settings: { timezone: formData.timezone },
                    verticals: [currentVertical]
                });
            } else {
                savedOrg = await organizationService.create({
                    ...formData,
                    settings: { timezone: formData.timezone },
                    verticals: [currentVertical]
                });
            }
            // Upload logo if a file was selected
            if (logoFile && savedOrg?._id) {
                try {
                    const uploadResult = await organizationService.uploadLogo(savedOrg._id, logoFile);
                    // Update user context if this is the current user's organization
                    if (user?.organizationId === savedOrg._id && uploadResult.logo) {
                        login({
                            ...user,
                            organizationLogo: uploadResult.logo
                        });
                    }
                } catch (logoErr) {
                    console.warn('Logo upload failed:', logoErr);
                }
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

    const inputStyle = {
        backgroundColor: 'var(--theme-bg-sidebar)',
        borderColor: 'rgba(255,255,255,0.1)',
        color: 'var(--theme-text-main)'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text-main)' }}>
                    Organizations
                </h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm font-bold uppercase tracking-widest"
                    style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}
                >
                    <Plus className="w-4 h-4" />
                    Add Organization
                </button>
            </div>

            {/* Search */}
            <div
                className="p-4 rounded-xl border transition-colors duration-500"
                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}
            >
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-40" style={{ color: 'var(--theme-text-main)' }} />
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none transition-all duration-300 text-sm"
                        style={inputStyle}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Error Banner */}
            {error && !isModalOpen && (
                <div className="p-4 rounded-xl border-l-4 flex items-center gap-3"
                    style={{ backgroundColor: 'rgba(244,63,94,0.08)', borderLeftColor: '#f43f5e' }}>
                    <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: '#f43f5e' }} />
                    <p className="text-sm" style={{ color: '#f43f5e' }}>{error}</p>
                </div>
            )}

            {/* Organizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-sm col-span-3 opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Loading organizations...</p>
                ) : filteredOrgs.length === 0 ? (
                    <p className="text-sm col-span-3 opacity-50" style={{ color: 'var(--theme-text-muted)' }}>No organizations found.</p>
                ) : (
                    filteredOrgs.map((org) => (
                        <div
                            key={org._id}
                            className="rounded-2xl border p-6 hover:translate-y-[-2px] transition-all duration-300 shadow-sm hover:shadow-md"
                            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(var(--theme-primary-rgb, 99,102,241),0.1)' }}>
                                    {org.logo
                                        ? <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}/uploads/org-logos/org-${org._id}.jpg`} alt="logo" className="w-10 h-10 rounded-lg object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                                        : <Building className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />}
                                </div>
                                <span
                                    className="px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-full"
                                    style={{
                                        backgroundColor: org.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(244,63,94,0.1)',
                                        color: org.status === 'ACTIVE' ? '#22c55e' : '#f43f5e'
                                    }}
                                >
                                    {org.status}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--theme-text-main)' }}>{org.displayName}</h3>
                            <p className="text-xs font-mono mb-4 opacity-50" style={{ color: 'var(--theme-text-muted)' }}>{org.code}</p>

                            <div className="space-y-1 text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold" style={{ color: 'var(--theme-text-main)' }}>Email:</span> {org.contactEmail}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold" style={{ color: 'var(--theme-text-main)' }}>Phone:</span> {org.contactPhone}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                <button
                                    onClick={() => handleOpenModal(org)}
                                    className="p-2 rounded-xl transition-colors hover:bg-white/5"
                                    style={{ color: 'var(--theme-text-muted)' }}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(org._id)}
                                    className="p-2 rounded-xl transition-colors hover:bg-rose-500/10"
                                    style={{ color: '#f43f5e' }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div
                        className="rounded-2xl w-full max-w-lg overflow-hidden border shadow-2xl"
                        style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--theme-text-main)' }}>
                                {selectedOrg ? 'Edit Organization' : 'New Organization'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 rounded-xl flex items-center gap-2 text-sm border"
                                    style={{ backgroundColor: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.2)', color: '#f43f5e' }}>
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {!selectedOrg && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Organization Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 rounded-xl border focus:outline-none text-sm transition-all"
                                            style={inputStyle}
                                            value={formData.displayName}
                                            onChange={(e) => {
                                                const val = e.target.value;
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
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Code</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 rounded-xl border focus:outline-none text-sm transition-all"
                                            style={inputStyle}
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            placeholder="e.g. ABC001"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Contact Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-3 py-2 rounded-xl border focus:outline-none text-sm transition-all"
                                        style={inputStyle}
                                        value={formData.contactEmail}
                                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Contact Phone</label>
                                    <input
                                        type="tel"
                                        required
                                        maxLength={10}
                                        pattern="[0-9]{10}"
                                        className="w-full px-3 py-2 rounded-xl border focus:outline-none text-sm transition-all"
                                        style={inputStyle}
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
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Address</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-xl border focus:outline-none text-sm transition-all resize-none"
                                    style={inputStyle}
                                    rows="2"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            {/* Logo Upload Section */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Organization Logo</label>
                                <div className="flex items-center gap-4">
                                    <div
                                        onClick={() => logoInputRef.current?.click()}
                                        className="w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors overflow-hidden"
                                        style={{ borderColor: 'var(--theme-primary)', backgroundColor: logoPreview ? 'white' : 'transparent' }}
                                    >
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="flex flex-col items-center opacity-50">
                                                <Plus className="w-5 h-5 mb-1" style={{ color: 'var(--theme-text-main)' }} />
                                                <span className="text-[8px] font-bold uppercase" style={{ color: 'var(--theme-text-main)' }}>JPG/PNG</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            ref={logoInputRef}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setLogoFile(file);
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setLogoPreview(reader.result);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                        />
                                        <div className="text-xs opacity-60" style={{ color: 'var(--theme-text-muted)' }}>
                                            Upload a logo for the sidebar. Keep it under 2MB.
                                        </div>
                                        {(logoFile || logoPreview) && (
                                            <button
                                                type="button"
                                                onClick={() => { setLogoFile(null); setLogoPreview(null); if (logoInputRef.current) logoInputRef.current.value = ''; }}
                                                className="mt-2 text-[10px] font-bold uppercase text-rose-500 hover:text-rose-400"
                                            >
                                                Remove Selection
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:bg-white/5"
                                    style={{ color: 'var(--theme-text-muted)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-lg"
                                    style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}
                                >
                                    {selectedOrg ? 'Save Changes' : 'Create Organization'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Organizations;
