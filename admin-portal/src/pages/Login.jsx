import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tripService } from '../services/api';
import logo from '../assets/logo.png';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

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
                setError('Access Denied: This portal is for Administrators only.');
                setLoading(false);
                return;
            }

            login(response.user);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <img src={`${logo}?v=2`} alt="SetGo Logo" className="h-40 mx-auto mb-6" />
                    <p className="text-gray-400 text-3xl font-bold">Admin Portal</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="h-2 bg-gradient-to-r from-blue-400 to-indigo-500"></div>

                    <div className="p-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sign In</h2>

                        {error && (
                            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                                <div className="flex items-center">
                                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        id="username"
                                        required
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Enter your username"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        id="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        placeholder="Enter your password"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-8">
                    © 2026 SetGo. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Login;
