import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";

const LoginPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            console.log('Login successful:', data);

            setIsLoading(false);
            setIsRedirecting(true);

            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);

        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Invalid email or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {isRedirecting && <Loading message="Login successful! Redirecting to dashboard..." />}
            <Navbar />
            <div className="signup">
                <div className="signup-header-container">
                    <div className="signup-header">
                        <h1 className="overview-header">welcome back.</h1>
                        <p className="contact-subtitle">Sign in to your account to continue your learning journey.</p>
                    </div>
                </div>
                <div className="contact-content">
                    <div className="contact-form-container">
                        <form className="contact-form" onSubmit={handleSubmit}>
                            {error && (
                                <div className="error-message" style={{
                                    background: '#fee',
                                    color: '#c33',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    textAlign: 'center',
                                    fontSize: '0.9rem'
                                }}>
                                    {error}
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your email address"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your password"
                                />
                            </div>

                            <div className="form-options" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem',
                                fontSize: '0.9rem'
                            }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" />
                                    Remember me
                                </label>
                                <a href="#" style={{ color: 'var(--purple)', textDecoration: 'none' }}>
                                    Forgot password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                className="submit-button"
                                disabled={isLoading}
                                style={{
                                    opacity: isLoading ? 0.7 : 1,
                                    cursor: isLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>

                            <div className="login-footer" style={{
                                textAlign: 'center',
                                marginTop: '2rem',
                                paddingTop: '2rem',
                                borderTop: '1px solid #eee',
                                color: '#666'
                            }}>
                                <p>Don't have an account? <a href="/signup" style={{ color: 'var(--purple)', textDecoration: 'none', fontWeight: '500' }}>Sign up here</a></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
