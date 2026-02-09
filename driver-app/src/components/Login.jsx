import { useState } from 'react';
import { authService } from '../services/api';
import './Login.css';

function Login({ onLogin }) {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('12345');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await authService.login(phone, password);
            if (result.success) {
                // Store driver data in localStorage
                localStorage.setItem('driver', JSON.stringify(result.driver));
                onLogin(result.driver);
            }
        } catch (err) {
            setError('Invalid phone number or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-header">
                <h1>Jubilant Setgo</h1>
                <p>Driver Login</p>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="Enter your phone number"
                        pattern="[0-9]{10}"
                        title="Please enter a 10-digit phone number"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password *</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter password"
                    />
                </div>

                <button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}

export default Login;
