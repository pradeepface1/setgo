import React, { useState, useEffect } from 'react';
import { User, UserPlus, Clock, Shield, Edit, Trash2 } from 'lucide-react';
import CreateUserModal from '../components/users/CreateUserModal';
import { tripService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [error, setError] = useState(null);
    const [userToEdit, setUserToEdit] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await tripService.getUsers();
            setUsers(data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUserCreated = () => {
        fetchUsers();
        setUserToEdit(null);
    };

    const handleEdit = (user) => {
        setUserToEdit(user);
        setShowCreateModal(true);
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            // Optimistic update
            setUsers(users.filter(u => u._id !== userId));
            await tripService.deleteUser(userId);
            // Re-fetch to be safe
            fetchUsers();
        } catch (err) {
            setError('Failed to delete user');
            fetchUsers(); // Revert on error
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">User Management</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage admin access and roles</p>
                </div>
                <button
                    onClick={() => {
                        setUserToEdit(null);
                        setShowCreateModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                </button>
            </div>

            <CreateUserModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setUserToEdit(null);
                }}
                onUserCreated={handleUserCreated}
                userToEdit={userToEdit}
            />

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Shield className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 text-sm">Loading users...</div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 text-sm">No users found. Create one to get started.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Commuters */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium mb-4 text-green-800">Commuters</h3>
                            <ul className="divide-y divide-gray-200 bg-white rounded shadow">
                                {users.filter(u => u.role !== 'SUPER_ADMIN' && u.role !== 'ORG_ADMIN').map(user => (
                                    <li key={user._id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-gray-900">{user.username}</div>
                                            {user.organizationId && <div className="text-xs text-gray-500">{user.organizationId.displayName || user.organizationId.name}</div>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900"><Edit className="h-4 w-4" /></button>
                                            <button onClick={() => handleDelete(user._id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Org Admins */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium mb-4 text-blue-800">Org Admins</h3>
                            <ul className="divide-y divide-gray-200 bg-white rounded shadow">
                                {users.filter(u => u.role === 'ORG_ADMIN').map(user => (
                                    <li key={user._id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-gray-900">{user.username}</div>
                                            {user.organizationId && <div className="text-xs text-gray-500">{user.organizationId.displayName || user.organizationId.name}</div>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900"><Edit className="h-4 w-4" /></button>
                                            <button onClick={() => handleDelete(user._id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Super Admins - Only visible to SUPER_ADMIN users */}
                        {currentUser?.role === 'SUPER_ADMIN' && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-4 text-purple-800">Super Admins</h3>
                                <ul className="divide-y divide-gray-200 bg-white rounded shadow">
                                    {users.filter(u => u.role === 'SUPER_ADMIN').map(user => (
                                        <li key={user._id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                            <div>
                                                <div className="font-medium text-gray-900">{user.username}</div>
                                            </div>
                                            {/* No Actions for Super Admin */}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Users;
