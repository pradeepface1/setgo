import React, { useState, useEffect } from 'react';
import { User, UserPlus, Clock, Shield, Edit, Trash2 } from 'lucide-react';
import CreateUserModal from '../components/users/CreateUserModal';
import { tripService } from '../services/api';

const Users = () => {
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
            setError('Failed to load users');
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
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                            <li key={user._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150 ease-in-out">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <User className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                                                        user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}>
                                                    {user.role === 'superadmin' ? 'Super Admin' :
                                                        user.role === 'admin' ? 'Admin' :
                                                            'Commuter'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                            <p>Created {new Date(user.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 focus:outline-none transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            {user.username !== 'superadmin' && (
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 focus:outline-none transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Users;
