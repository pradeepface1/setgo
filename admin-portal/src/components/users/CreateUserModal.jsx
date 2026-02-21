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
                    // Pass currentVertical to filter organizations, even for Super Admin
                    const data = await organizationService.getAll(currentVertical);
                    setOrganizations(data);
                } catch (err) {
                    console.error('Failed to fetch organizations:', err);
                    setError('Failed to load organizations');
                }
            };
            fetchOrgs();
        }
    }, [isOpen, isSuperAdmin, currentVertical]);

    useEffect(() => {
        if (isOpen) {
            // Determine default role based on creator's role
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

    const handleClose = () => {
        setError(null);
        onClose();
    };

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

        if (isSuperAdmin && (['ORG_ADMIN', 'COMMUTER', 'TAXI_ADMIN', 'LOGISTICS_ADMIN'].includes(formData.role)) && !formData.organizationId) {
            setError('Please select an organization');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                username: formData.username,
                role: formData.role,
                vertical: currentVertical || 'TAXI' // Send current vertical context
            };

            if (formData.password) payload.password = formData.password;

            // Only send organizationId if pertinent
            if (isSuperAdmin && (['ORG_ADMIN', 'COMMUTER', 'TAXI_ADMIN', 'LOGISTICS_ADMIN'].includes(formData.role))) {
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
            console.error('User handling error:', err);
            setError(err.message || `Failed to ${userToEdit ? 'update' : 'create'} user`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ring-1 ring-gray-900/5">
                    {/* Decorative header */}
                    <div className="h-2 bg-gradient-to-r from-blue-400 to-indigo-500"></div>

                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    {userToEdit ? 'Edit User' : 'Create New User'}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 mb-4">
                                        {userToEdit
                                            ? 'Update details for this user. Leave password blank to keep unchanged.'
                                            : 'Create a new user account for accessing the admin portal.'}
                                    </p>

                                    {error && (
                                        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <X className="h-5 w-5 text-red-400" />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-red-700">{error}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <form id="create-user-form" onSubmit={handleSubmit} className="space-y-4">
                                        {/* User Role Selection */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">User Role</label>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-wrap gap-4">
                                                    {(() => {
                                                        let availableRoles = [];

                                                        // Super Admin Logic
                                                        if (isSuperAdmin) {
                                                            if (currentVertical === 'TAXI') {
                                                                availableRoles = ['ORG_ADMIN'];
                                                            } else if (currentVertical === 'LOGISTICS') {
                                                                availableRoles = ['ORG_ADMIN', 'ROAD_PILOT'];
                                                            }
                                                        }
                                                        // Org Admin / Vertical Admin Logic
                                                        else {
                                                            // For Taxi Admins (Org Admin in Taxi vertical)
                                                            if (currentVertical === 'TAXI' && ['ORG_ADMIN', 'TAXI_ADMIN'].includes(user?.role)) {
                                                                availableRoles = ['COMMUTER', 'ORG_ADMIN'];
                                                            }
                                                            // For Logistics Admins (Org Admin in Logistics vertical)
                                                            else if (currentVertical === 'LOGISTICS' && ['ORG_ADMIN', 'LOGISTICS_ADMIN'].includes(user?.role)) {
                                                                availableRoles = ['ROAD_PILOT'];
                                                            }
                                                        }

                                                        const roleLabels = {
                                                            'ORG_ADMIN': 'Org Admin',
                                                            'TAXI_ADMIN': 'Car Admin',
                                                            'LOGISTICS_ADMIN': 'Logistics Admin',
                                                            'COMMUTER': 'Commuter',
                                                            'ROAD_PILOT': 'Road Pilot'
                                                        };

                                                        return availableRoles.map(role => (
                                                            <label key={role} className="flex items-center cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name="role"
                                                                    value={role}
                                                                    checked={formData.role === role}
                                                                    onChange={handleChange}
                                                                    className="h-4 w-4 text-jubilant-600 focus:ring-jubilant-500 border-gray-300"
                                                                />
                                                                <span className="ml-2 text-sm text-gray-700">{roleLabels[role] || role}</span>
                                                            </label>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Organization Dropdown (For Super Admin creating specific roles) */}
                                        {isSuperAdmin && (['ORG_ADMIN', 'COMMUTER', 'TAXI_ADMIN', 'LOGISTICS_ADMIN'].includes(formData.role)) && (
                                            <div>
                                                <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700">Organization</label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Building className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <select
                                                        name="organizationId"
                                                        id="organizationId"
                                                        required
                                                        className="focus:ring-jubilant-500 focus:border-jubilant-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                                        value={formData.organizationId}
                                                        onChange={handleChange}
                                                    >
                                                        <option value="">Select Organization</option>
                                                        {organizations.map(org => (
                                                            <option key={org._id} value={org._id}>
                                                                {org.displayName} ({org.code})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <User className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    id="username"
                                                    required
                                                    className="focus:ring-jubilant-500 focus:border-jubilant-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                                    placeholder="Enter username"
                                                    value={formData.username}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                                {userToEdit ? 'New Password (Optional)' : 'Password'}
                                            </label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Lock className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    id="password"
                                                    required={!userToEdit}
                                                    minLength={6}
                                                    className="focus:ring-jubilant-500 focus:border-jubilant-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                                    placeholder={userToEdit ? "Leave blank to keep current" : "Enter password"}
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Lock className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    id="confirmPassword"
                                                    required={!userToEdit && formData.password.length > 0}
                                                    minLength={6}
                                                    className="focus:ring-jubilant-500 focus:border-jubilant-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                                    placeholder="Confirm password"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (userToEdit ? 'Updating...' : 'Creating...') : (userToEdit ? 'Update User' : 'Create User')}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;
