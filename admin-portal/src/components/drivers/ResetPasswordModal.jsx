import React, { useState } from 'react';
import { tripService } from '../../services/api';
import { Lock } from 'lucide-react';

const ResetPasswordModal = ({ driver, onClose, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 5) {
            setError('Password must be at least 5 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`Attempting to reset password for driver: ${driver._id}`);
            await tripService.updateDriver(driver._id, { password: password });

            // Show success alert or callback
            alert('Password updated successfully');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Password reset error:', err);
            setError(err.message || 'Failed to update password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-white px-8 pt-6 pb-6 rounded-2xl">
                    <div className="absolute top-4 right-4 cursor-pointer" onClick={onClose}>
                        {/* Optional close icon if needed, but we have Cancel button */}
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 mb-4">
                            <Lock className="h-8 w-8 text-blue-600" aria-hidden="true" />
                        </div>
                        <h3 className="text-xl leading-6 font-semibold text-gray-900 text-center" id="modal-title">
                            Reset Password
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 text-center">
                            Set a new password for <span className="font-semibold text-gray-700">{driver.name}</span>
                        </p>
                    </div>

                    <div className="mt-6">
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                                    New Password
                                </label>
                                <input
                                    className="appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    minLength={5}
                                    autoComplete="new-password"
                                />
                                <p className="text-xs text-gray-400 mt-2 ml-1">Must be at least 5 characters long</p>
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="confirmPassword">
                                    Confirm New Password
                                </label>
                                <input
                                    className="appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                    minLength={5}
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full inline-flex justify-center rounded-lg border border-gray-200 shadow-sm px-4 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 sm:w-auto sm:flex-1 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-3 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:flex-1 transition-all ${loading ? 'opacity-70 cursor-wait' : 'hover:shadow-lg transform hover:-translate-y-0.5'}`}
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ResetPasswordModal;
