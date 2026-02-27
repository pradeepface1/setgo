import React, { useState, useEffect } from 'react';
import { X, User, Lock, Building } from 'lucide-react';
import { tripService, organizationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const CreateUserModal = ({ isOpen, onClose, onUserCreated, userToEdit = null }) => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'ORG_ADMIN',
        organizationId: ''
    });
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { currentVertical } = useSettings();

    useEffect(() => {
        if (isOpen && isSuperAdmin && currentVertical) {
            const fetchOrgs = async () => {
                try {
                    const data = await organizationService.getAll(currentVertical);
                    setOrganizations(data);
                } catch (err) {
                    setError('Failed to load organizations');
                }
            };
            fetchOrgs();
        }
    }, [isOpen, isSuperAdmin, currentVertical]);

    useEffect(() => {
        if (isOpen) {
            let defaultRole = 'ORG_ADMIN';
            if (user?.role === 'LOGISTICS_ADMIN') defaultRole = 'ROAD_PILOT';
            else if (user?.role === 'TAXI_ADMIN') defaultRole = 'COMMUTER';
            else if (isSuperAdmin) defaultRole = 'ORG_ADMIN';

            if (userToEdit) {
                setFormData({
                    username: userToEdit.username,
                    password: '',
                    confirmPassword: '',
                    role: userToEdit.role || defaultRole,
                    organizationId: userToEdit.organizationId || ''
                });
            } else {
                setFormData({
                    username: '',
                    password: '',
                    confirmPassword: '',
                    role: defaultRole,
                    organizationId: (isSuperAdmin ? '' : user?.organizationId) || ''
                });
            }
            setError(null);
        }
    }, [isOpen, userToEdit, isSuperAdmin, user]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const handleClose = () => { setError(null); onClose(); };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        if (!userToEdit && formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }
        if (userToEdit && formData.password && formData.password.length < 6) {
            setError('New password must be at least 6 characters long');
            setLoading(false);
            return;
        }
        if (isSuperAdmin && (['ORG_ADMIN', 'COMMUTER', 'TAXI_ADMIN', 'LOGISTICS_ADMIN', 'LOGISTICS_STAFF'].includes(formData.role)) && !formData.organizationId) {
            setError('Please select an organization');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                username: formData.username,
                role: formData.role,
                vertical: currentVertical || 'TAXI'
            };
            if (formData.password) payload.password = formData.password;
            if (isSuperAdmin && (['ORG_ADMIN', 'COMMUTER', 'TAXI_ADMIN', 'LOGISTICS_ADMIN', 'LOGISTICS_STAFF'].includes(formData.role))) {
                payload.organizationId = formData.organizationId;
            }
            if (userToEdit) {
                await tripService.updateUser(userToEdit._id, payload);
            } else {
                await tripService.createUser(payload);
            }
            onUserCreated();
            handleClose();
        } catch (err) {
            setError(err.message || `Failed to ${userToEdit ? 'update' : 'create'} user`);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        backgroundColor: 'var(--theme-bg-sidebar)',
        borderColor: 'rgba(255,255,255,0.1)',
        color: 'var(--theme-text-main)'
    };

    const roleLabels = {
        'ORG_ADMIN': 'Org Admin',
        'TAXI_ADMIN': 'Car Admin',
        'LOGISTICS_ADMIN': 'Logistics Admin',
        'LOGISTICS_STAFF': 'Logistics Staff', // New role – no profit visibility
        'COMMUTER': 'Commuter',
        'ROAD_PILOT': 'Road Pilot',
        'SUPER_ADMIN': 'Super Admin'
    };

    let availableRoles = [];
    if (isSuperAdmin) {
        availableRoles = currentVertical === 'TAXI' ? ['ORG_ADMIN'] : ['ORG_ADMIN', 'ROAD_PILOT'];
    } else {
        if (currentVertical === 'TAXI' && ['ORG_ADMIN', 'TAXI_ADMIN'].includes(user?.role)) {
            availableRoles = ['COMMUTER', 'ORG_ADMIN'];
        } else if (currentVertical === 'LOGISTICS' && ['ORG_ADMIN', 'LOGISTICS_ADMIN'].includes(user?.role)) {
            availableRoles = ['ROAD_PILOT', 'LOGISTICS_STAFF'];
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose}></div>

            <div
                className="relative z-10 w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-colors duration-500"
                style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'rgba(255,255,255,0.05)' }}
            >
                {/* Decorative top bar */}
                <div className="h-1.5 w-full" style={{ background: 'linear-gradient(to right, var(--theme-primary), #818cf8)' }}></div>

                {/* Header */}
                <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--theme-primary-rgb,99,102,241),0.15)' }}>
                            <User className="h-5 w-5" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--theme-text-main)' }}>
                                {userToEdit ? 'Edit User' : 'Create New User'}
                            </h3>
                            <p className="text-[10px] opacity-50 mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                                {userToEdit ? 'Leave password blank to keep unchanged.' : 'Create a new admin portal account.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-xl transition-colors hover:bg-white/5 opacity-50 hover:opacity-100" style={{ color: 'var(--theme-text-main)' }}>
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form body */}
                <div className="px-6 py-5">
                    {error && (
                        <div className="mb-4 p-3 rounded-xl border-l-4 flex items-center gap-2 text-sm"
                            style={{ backgroundColor: 'rgba(244,63,94,0.08)', borderLeftColor: '#f43f5e', color: '#f43f5e' }}>
                            <X className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form id="create-user-form" onSubmit={handleSubmit} className="space-y-4">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--theme-text-muted)' }}>User Role</label>
                            <div className="flex flex-wrap gap-3">
                                {availableRoles.map(role => (
                                    <label
                                        key={role}
                                        className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border transition-all"
                                        style={{
                                            borderColor: formData.role === role ? 'var(--theme-primary)' : 'rgba(255,255,255,0.08)',
                                            backgroundColor: formData.role === role ? 'rgba(var(--theme-primary-rgb,99,102,241),0.12)' : 'transparent'
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={role}
                                            checked={formData.role === role}
                                            onChange={handleChange}
                                            className="sr-only"
                                        />
                                        <span className="text-xs font-bold" style={{ color: formData.role === role ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}>
                                            {roleLabels[role] || role}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Organization Dropdown */}
                        {isSuperAdmin && (['ORG_ADMIN', 'COMMUTER', 'TAXI_ADMIN', 'LOGISTICS_ADMIN', 'LOGISTICS_STAFF'].includes(formData.role)) && (
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Organization</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <Building className="h-4 w-4 opacity-40" style={{ color: 'var(--theme-text-main)' }} />
                                    </div>
                                    <select
                                        name="organizationId"
                                        required
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border focus:outline-none text-sm appearance-none transition-all"
                                        style={inputStyle}
                                        value={formData.organizationId}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Organization</option>
                                        {organizations.map(org => (
                                            <option key={org._id} value={org._id}>{org.displayName} ({org.code})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Username */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <User className="h-4 w-4 opacity-40" style={{ color: 'var(--theme-text-main)' }} />
                                </div>
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border focus:outline-none text-sm transition-all"
                                    style={inputStyle}
                                    placeholder="Enter username"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>
                                {userToEdit ? 'New Password (Optional)' : 'Password'}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 opacity-40" style={{ color: 'var(--theme-text-main)' }} />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    required={!userToEdit}
                                    minLength={6}
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border focus:outline-none text-sm transition-all"
                                    style={inputStyle}
                                    placeholder={userToEdit ? 'Leave blank to keep current' : 'Enter password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--theme-text-muted)' }}>Confirm Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 opacity-40" style={{ color: 'var(--theme-text-main)' }} />
                                </div>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    required={!userToEdit && formData.password.length > 0}
                                    minLength={6}
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border focus:outline-none text-sm transition-all"
                                    style={inputStyle}
                                    placeholder="Confirm password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.08)' }}>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:bg-white/5"
                        style={{ color: 'var(--theme-text-muted)' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}
                    >
                        {loading ? (userToEdit ? 'Updating...' : 'Creating...') : (userToEdit ? 'Update User' : 'Create User')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;
