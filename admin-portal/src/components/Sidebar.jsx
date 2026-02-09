import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Car, Users, FileText, Settings, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './common/ProfileModal';

const Sidebar = () => {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/trips', icon: Car, label: 'Trips' },
        { to: '/drivers', icon: Users, label: 'Drivers' },
        { to: '/users', icon: Shield, label: 'Users' },
        { to: '/reports', icon: FileText, label: 'Reports' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { user } = useAuth(); // Assuming AuthContext provides user

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
            <div className="h-16 flex items-center justify-center border-b border-gray-200">
                <h1 className="text-2xl font-bold text-jubilant-600">Jubilant</h1>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive
                                ? 'bg-jubilant-50 text-jubilant-600'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors" onClick={() => setIsProfileOpen(true)}>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                        {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">{user?.username || 'Admin'}</p>
                        <p className="text-xs text-jubilant-600 font-medium">View Profile</p>
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            {isProfileOpen && (
                <ProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    user={user}
                />
            )}
        </aside>
    );
};

export default Sidebar;
