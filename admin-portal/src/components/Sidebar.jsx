import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Car, Users, FileText, Settings, Shield, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './common/ProfileModal';
import logoImage from '../assets/logo.png';

const Sidebar = () => {
    const { user } = useAuth();

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/trips', icon: Car, label: 'Trips' },
        { to: '/drivers', icon: Users, label: 'Drivers' },
        ...(user?.role === 'SUPER_ADMIN' ? [{ to: '/organizations', icon: Building, label: 'Organizations' }] : []),
        { to: '/users', icon: Shield, label: 'Users' },
        { to: '/reports', icon: FileText, label: 'Reports' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
            <div className="h-36 flex items-center justify-center border-b border-gray-200 py-4">
                <img src={logoImage} alt="SetGo" className="h-32 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive
                                ? 'bg-gray-900 text-white shadow-md'
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
            </div>

            {/* Profile Modal */}
            {
                isProfileOpen && (
                    <ProfileModal
                        isOpen={isProfileOpen}
                        onClose={() => setIsProfileOpen(false)}
                        user={user}
                    />
                )
            }
        </aside >
    );
};

export default Sidebar;
