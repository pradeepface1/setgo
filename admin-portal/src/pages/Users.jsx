import React, { useState, useEffect } from 'react';
import { User, UserPlus, Shield, Edit, Trash2 } from 'lucide-react';
import CreateUserModal from '../components/users/CreateUserModal';
import { tripService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const Users = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [error, setError] = useState(null);
    const [userToEdit, setUserToEdit] = useState(null);

    const { currentVertical } = useSettings();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await tripService.getUsers();

            const filteredData = data.filter(u => {
                if (u.vertical) return u.vertical === currentVertical;
                if (u.organizationId?.verticals?.length > 0) return u.organizationId.verticals.includes(currentVertical);
                if (currentVertical === 'LOGISTICS') return ['LOGISTICS_ADMIN', 'ROAD_PILOT', 'LOGISTICS_STAFF'].includes(u.role);
                return ['TAXI_ADMIN', 'ORG_ADMIN', 'COMMUTER'].includes(u.role);
            });

            setUsers(filteredData);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [currentVertical]);

    const handleUserCreated = () => { fetchUsers(); setUserToEdit(null); };
    const handleEdit = (user) => { setUserToEdit(user); setShowCreateModal(true); };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            setUsers(users.filter(u => u._id !== userId));
            await tripService.deleteUser(userId);
            fetchUsers();
        } catch (err) {
            setError('Failed to delete user');
            fetchUsers();
        }
    };

    const UserGroupCard = ({ title, accentColor, users: groupUsers }) => (
        <div
            className="rounded-2xl border overflow-hidden transition-colors duration-500"
            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}
        >
            <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: accentColor }}></div>
                <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--theme-text-main)' }}>{title}</h3>
                <span
                    className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
                >
                    {groupUsers.length}
                </span>
            </div>
            {groupUsers.length === 0 ? (
                <p className="p-5 text-xs opacity-50" style={{ color: 'var(--theme-text-muted)' }}>No users in this group.</p>
            ) : (
                <ul>
                    {groupUsers.map(user => (
                        <li
                            key={user._id}
                            className="px-5 py-3 flex justify-between items-center hover:bg-white/5 transition-colors border-b last:border-0"
                            style={{ borderColor: 'rgba(255,255,255,0.03)' }}
                        >
                            <div>
                                <div className="text-sm font-semibold" style={{ color: 'var(--theme-text-main)' }}>{user.username}</div>
                                {user.organizationId && (
                                    <div className="text-[10px] opacity-50 mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                                        {user.organizationId.displayName || user.organizationId.name}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEdit(user)}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-sky-500/10"
                                    style={{ color: '#38bdf8' }}
                                >
                                    <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(user._id)}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-rose-500/10"
                                    style={{ color: '#f43f5e' }}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text-main)' }}>User Management</h1>
                    <p className="mt-1 text-xs opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Manage admin access and roles</p>
                </div>
                <button
                    onClick={() => { setUserToEdit(null); setShowCreateModal(true); }}
                    className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                </button>
            </div>

            <CreateUserModal
                isOpen={showCreateModal}
                onClose={() => { setShowCreateModal(false); setUserToEdit(null); }}
                onUserCreated={handleUserCreated}
                userToEdit={userToEdit}
            />

            {error && (
                <div className="p-4 rounded-xl border-l-4 flex items-center gap-3"
                    style={{ backgroundColor: 'rgba(244,63,94,0.08)', borderLeftColor: '#f43f5e' }}>
                    <Shield className="h-5 w-5 flex-shrink-0" style={{ color: '#f43f5e' }} />
                    <p className="text-sm" style={{ color: '#f43f5e' }}>{error}</p>
                </div>
            )}

            {loading ? (
                <div
                    className="p-12 text-center rounded-2xl border text-sm opacity-50"
                    style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-muted)' }}
                >
                    Loading users...
                </div>
            ) : users.length === 0 ? (
                <div
                    className="p-12 text-center rounded-2xl border text-sm opacity-50"
                    style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-muted)' }}
                >
                    No users found. Create one to get started.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {currentVertical === 'TAXI' && (
                        <UserGroupCard
                            title="Commuters"
                            accentColor="#22c55e"
                            users={users.filter(u => u.role !== 'SUPER_ADMIN' && u.role !== 'ORG_ADMIN')}
                        />
                    )}

                    <UserGroupCard
                        title="Org Admins"
                        accentColor="#38bdf8"
                        users={users.filter(u => u.role === 'ORG_ADMIN')}
                    />

                    {currentUser?.role === 'SUPER_ADMIN' && (
                        <UserGroupCard
                            title="Super Admins"
                            accentColor="#a78bfa"
                            users={users.filter(u => u.role === 'SUPER_ADMIN')}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default Users;
