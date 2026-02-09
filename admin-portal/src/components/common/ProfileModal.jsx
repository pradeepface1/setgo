
import React from 'react';
import { X, User as UserIcon, Shield, Mail } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, user }) => {
    // Ensure user object exists and prevent rendering if closed
    if (!isOpen || !user) return null;

    // Helper to safely get username
    const username = user.username || 'Admin';
    const role = user.role || 'admin';
    const userId = user._id || user.id || 'N/A';
    const initial = username.charAt(0).toUpperCase();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden transform transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-jubilant-600 to-jubilant-700 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Profile Details</h3>
                    <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-jubilant-100 flex items-center justify-center text-jubilant-600 border-4 border-white shadow-lg">
                            <span className="text-3xl font-bold">{initial}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <UserIcon className="h-5 w-5 text-gray-500 mr-3" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase">Username</p>
                                <p className="text-sm font-semibold text-gray-900">{username}</p>
                            </div>
                        </div>

                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <Shield className="h-5 w-5 text-gray-500 mr-3" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase">Role</p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                                    role === 'admin' ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </span>
                            </div>
                        </div>

                        {/* ID */}
                        <div className="text-center pt-2">
                            <p className="text-xs text-gray-400">User ID: {userId}</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-100">
                        <button
                            onClick={onClose}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors uppercase tracking-wider"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
