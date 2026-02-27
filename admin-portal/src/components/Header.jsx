import React from 'react';
import { Search, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header
            className="h-16 backdrop-blur-xl border-b flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-500"
            style={{
                backgroundColor: 'rgba(255,255,255,0.01)', // Very thin base, mostly blur
                borderColor: 'rgba(255,255,255,0.05)',
                borderBottomColor: 'var(--theme-bg-card)'
            }}
        >
            <div className="flex items-center w-full max-w-md">
                <div className="relative w-full group">
                    <span
                        className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-theme-primary"
                        style={{ '--tw-text-opacity': '1' }}
                    >
                        <Search className="h-4 w-4 text-gray-400" style={{ color: 'var(--theme-text-muted)' }} />
                    </span>
                    <input
                        type="text"
                        className="block w-full pl-11 pr-4 py-2 border-none rounded-2xl leading-5 transition-all duration-300 sm:text-sm shadow-sm focus:outline-none focus:ring-2"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: 'var(--theme-text-main)',
                            '--tw-ring-color': 'var(--theme-primary)'
                        }}
                        placeholder={t('search_placeholder')}
                    />
                </div>
            </div>

            <div className="flex items-center space-x-6">

                {/* User Info */}
                <div className="flex items-center space-x-4 border-l border-white/5 pl-6">
                    <div className="flex items-center space-x-3 group cursor-pointer">
                        <div
                            className="h-10 w-10 rounded-2xl p-[2px] shadow-lg group-hover:scale-105 transition-transform duration-300"
                            style={{
                                background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))',
                                boxShadow: '0 4px 15px var(--theme-primary-glow)'
                            }}
                        >
                            <div
                                className="h-full w-full rounded-[14px] flex items-center justify-center overflow-hidden"
                                style={{ backgroundColor: 'var(--theme-bg-sidebar)' }}
                            >
                                <User className="h-5 w-5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                        </div>
                        <div className="text-sm hidden sm:block">
                            <p className="font-bold leading-none mb-1" style={{ color: 'var(--theme-text-main)' }}>{user?.username}</p>
                            <p className="text-[10px] uppercase tracking-widest font-extrabold flex items-center" style={{ color: 'var(--theme-text-muted)' }}>
                                <Shield className="h-2.5 w-2.5 mr-1" style={{ color: 'var(--theme-primary)' }} />
                                {user?.role === 'SUPER_ADMIN' ? t('super_admin') :
                                    user?.role === 'ADMIN' ? t('admin') : ''}
                            </p>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="p-2.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all duration-300 group"
                        title={t('logout')}
                    >
                        <LogOut className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
