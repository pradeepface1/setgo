import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/api';
import Logo from '../components/common/Logo';
import { useTranslation } from 'react-i18next';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();
    const { t } = useTranslation();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await tripService.login(formData.username, formData.password);

            // Check Role - Only allow Admins
            if (response.user.role !== 'SUPER_ADMIN' && response.user.role !== 'ORG_ADMIN') {
                setError(t('access_denied'));
                setLoading(false);
                return;
            }

            login(response.user);
            navigate('/');
        } catch (err) {
            setError(err.message || t('login_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500 relative overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-main)' }}>

            {/* Background Decorative Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ backgroundColor: 'var(--theme-primary)' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ backgroundColor: 'var(--theme-primary)' }}></div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo/Brand */}
                <div className="flex flex-col items-center mb-8">
                    <Logo className="h-24 scale-150" />
                </div>

                {/* Login Card */}
                <div
                    className="backdrop-blur-xl rounded-3xl shadow-2xl border transition-colors duration-500 overflow-hidden"
                    style={{
                        backgroundColor: 'var(--theme-bg-sidebar)', // using sidebar color for slight transparency effect
                        borderColor: 'rgba(255,255,255,0.05)'
                    }}
                >
                    {/* Header line */}
                    <div className="h-1.5 w-full" style={{ backgroundColor: 'var(--theme-primary)' }}></div>

                    <div className="p-8">
                        <h2 className="text-2xl font-black tracking-tight mb-8 text-center" style={{ color: 'var(--theme-text-main)' }}>
                            {t('sign_in')}
                        </h2>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl flex items-center border" style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
                                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" style={{ color: '#f43f5e' }} />
                                <p className="text-sm font-bold" style={{ color: '#f43f5e' }}>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="block text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2 pl-1" style={{ color: 'var(--theme-text-muted)' }}>
                                    {t('username')}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-opacity opacity-50 group-focus-within:opacity-100" style={{ color: 'var(--theme-primary)' }}>
                                        <User className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        id="username"
                                        required
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="block w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all text-sm font-medium"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-card)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            color: 'var(--theme-text-main)',
                                            '--tw-ring-color': 'var(--theme-primary)'
                                        }}
                                        placeholder={t('enter_username')}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2 pl-1" style={{ color: 'var(--theme-text-muted)' }}>
                                    {t('password')}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-opacity opacity-50 group-focus-within:opacity-100" style={{ color: 'var(--theme-primary)' }}>
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        id="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="block w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all text-sm font-medium"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-card)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            color: 'var(--theme-text-main)',
                                            '--tw-ring-color': 'var(--theme-primary)'
                                        }}
                                        placeholder={t('enter_password')}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg shadow-black/20 text-xs font-black uppercase tracking-widest transition-all hover:-translate-y-0.5 active:scale-95 text-white ${loading ? 'opacity-70 cursor-not-allowed transform-none hover:transform-none' : ''}`}
                                style={{ backgroundColor: 'var(--theme-primary)' }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                        {t('signing_in')}
                                    </>
                                ) : (
                                    t('sign_in')
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-[10px] font-bold uppercase tracking-widest opacity-40 mt-8" style={{ color: 'var(--theme-text-muted)' }}>
                    {t('copyright')}
                </p>
            </div>
        </div>
    );
};

export default Login;
