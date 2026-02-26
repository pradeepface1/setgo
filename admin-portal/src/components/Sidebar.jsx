import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Car, Users, FileText, Settings, Shield, Building, Truck, Store } from 'lucide-react'; // Added Store
import { useSettings } from '../context/SettingsContext'; // Import settings
import { useAuth } from '../context/AuthContext'; // Re-added useAuth import
import ProfileModal from './common/ProfileModal';
import Logo from './common/Logo';

import { useTranslation } from 'react-i18next'; // Import i18n hook

const Sidebar = () => {
    const { user } = useAuth();
    const { currentVertical, toggleVertical } = useSettings();
    const { t } = useTranslation(); // Init hook

    // Define items with their allowed verticals
    const allNavItems = [
        { to: '/', icon: LayoutDashboard, label: t('dashboard'), verticals: ['TAXI', 'LOGISTICS'] },
        { to: '/trips', icon: Car, label: t('trips'), verticals: ['TAXI'] },
        { to: '/rosters', icon: FileText, label: t('rosters'), verticals: ['TAXI'] },
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
        <aside
            className="w-64 border-r min-h-screen flex flex-col relative z-20 transition-colors duration-500"
            style={{
                backgroundColor: 'var(--theme-bg-sidebar)',
                borderColor: 'rgba(255,255,255,0.05)'
            }}
        >
            {/* Ambient Background Glow */}
            <div
                className="absolute top-0 left-0 w-full h-96 blur-[100px] pointer-events-none opacity-20 transition-all duration-700"
                style={{ backgroundColor: 'var(--theme-primary)' }}
            />

            <div className="h-auto min-h-[9rem] flex flex-col items-center justify-center border-b border-white/5 py-10 relative">
                <Logo className="h-20" />

                {/* Vertical Switcher for Super Admin */}
                {user?.role === 'SUPER_ADMIN' && (
                    <div className="flex bg-black/20 backdrop-blur-md rounded-xl p-1 mt-2 border border-white/5">
                        <button
                            onClick={() => toggleVertical('TAXI')}
                            className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all duration-300 ${currentVertical === 'TAXI'
                                ? 'text-white shadow-[0_0_15px_var(--theme-primary-glow)]'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                            style={currentVertical === 'TAXI' ? { backgroundColor: 'var(--theme-primary)' } : {}}
                        >
                            Taxi
                        </button>
                        <button
                            onClick={() => toggleVertical('LOGISTICS')}
                            className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all duration-300 ${currentVertical === 'LOGISTICS'
                                ? 'text-white shadow-[0_0_15px_var(--theme-primary-glow)]'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                            style={currentVertical === 'LOGISTICS' ? { backgroundColor: 'var(--theme-primary)' } : {}}
                        >
                            Logistics
                        </button>
                    </div>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                ? 'text-white shadow-lg'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`
                        }
                        style={({ isActive }) => isActive ? {
                            backgroundColor: 'var(--theme-primary)',
                            boxShadow: '0 4px 20px -5px var(--theme-primary-glow)'
                        } : {}}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 top-0 h-full w-1 bg-white shadow-[0_0_10px_#fff]" />
                                )}
                                <item.icon
                                    className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-theme-primary'}`}
                                    style={!isActive ? { '--tw-text-opacity': '1', color: 'var(--theme-text-muted)' } : {}}
                                />
                                <span className="relative z-10">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Section: Org Logo */}
            {user?.organizationLogo && user?.role !== 'SUPER_ADMIN' && (
                <div className="p-4 border-t border-white/5 flex justify-center mt-auto w-full">
                    <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${user.organizationLogo}`}
                        alt="Organization Logo"
                        className="h-32 w-auto max-w-[90%] object-contain bg-white/5 p-3 rounded-2xl border border-white/10 shadow-lg"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>
            )}

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
