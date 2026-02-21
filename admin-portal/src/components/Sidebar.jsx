import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Car, Users, FileText, Settings, Shield, Building, Truck, Store } from 'lucide-react'; // Added Store
import { useSettings } from '../context/SettingsContext'; // Import settings
import { useAuth } from '../context/AuthContext'; // Re-added useAuth import
import ProfileModal from './common/ProfileModal';
import logoImage from '../assets/logo_new.jpg';

import { useTranslation } from 'react-i18next'; // Import i18n hook

const Sidebar = () => {
    const { user } = useAuth();
    const { currentVertical, toggleVertical } = useSettings();
    const { t } = useTranslation(); // Init hook

    // Define items with their allowed verticals
    const allNavItems = [
        { to: '/', icon: LayoutDashboard, label: t('dashboard'), verticals: ['TAXI', 'LOGISTICS'] },
        { to: '/trips', icon: Car, label: t('trips'), verticals: ['TAXI'] },
        { to: '/drivers', icon: Users, label: t('drivers'), verticals: ['TAXI'] },
        { to: '/drivers', icon: Users, label: t('drivers'), verticals: ['LOGISTICS'] }, // TODO: Add specific key for Road Pilots if needed
        { to: '/consignors', icon: Store, label: t('consignors'), verticals: ['LOGISTICS'] },
        { to: '/logistics', icon: Truck, label: t('logistics'), verticals: ['LOGISTICS'] },
        { to: '/users', icon: Shield, label: t('users'), verticals: ['TAXI', 'LOGISTICS'] },
        { to: '/reports', icon: FileText, label: t('reports'), verticals: ['TAXI', 'LOGISTICS'] },
        { to: '/settings', icon: Settings, label: t('settings'), verticals: ['TAXI', 'LOGISTICS'] },
    ];

    // Filter items based on current vertical
    const navItems = allNavItems.filter(item =>
        item.verticals.includes(currentVertical)
    );

    // Add Organizations for Super Admin regardless of vertical
    if (user?.role === 'SUPER_ADMIN') {
        const orgIndex = navItems.findIndex(item => item.label === t('users')); // Match translated label
        if (orgIndex !== -1) {
            navItems.splice(orgIndex, 0, { to: '/organizations', icon: Building, label: t('organizations'), verticals: ['TAXI', 'LOGISTICS'] });
        }
    }

    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
            <div className="h-auto min-h-[9rem] flex flex-col items-center justify-center border-b border-gray-200 py-4">
                <img src={logoImage} alt="SetGo" className="h-48 w-auto object-contain mb-0" onError={(e) => e.target.style.display = 'none'} />

                {/* Vertical Switcher for Super Admin */}
                {user?.role === 'SUPER_ADMIN' && (
                    <div className="flex bg-gray-100 rounded-lg p-1 -mt-2">
                        <button
                            onClick={() => toggleVertical('TAXI')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${currentVertical === 'TAXI' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Taxi
                        </button>
                        <button
                            onClick={() => toggleVertical('LOGISTICS')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${currentVertical === 'LOGISTICS' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Logistics
                        </button>
                    </div>
                )}
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
