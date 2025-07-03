import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import Navbar from "../../components/Navbar";
import Loading from "../../components/Loading";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { PAGES } from "../../utils/constants";

const LoginPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });


    const [passwordVisible, setPasswordVisible] = useState(false);
    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

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
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/login`, {
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
                if (data.needsIntegration) {
                    navigate('/connect');
                } else {
                    navigate(PAGES.DASHBOARD.path);
                }
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
            {isRedirecting && <Loading message="Login successful! Redirecting to connect your accounts..." />}
            <Navbar />
            <div className="signup">
                <div className="signup-header-container">
                    <div className="signup-header">
                        <h1 className="overview-header">welcome back.</h1>
                        <p className="contact-subtitle">Sign in to your account to continue your learning journey.</p>
                    </div>
                </div>
                <div className="signup-content">
                    <div className="contact-form-container">
                        <form className="contact-form" onSubmit={handleSubmit}>
                            {error && (
                                <div className="error-message">
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
                                    type={passwordVisible ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your password"
                                />
                                <FontAwesomeIcon
                                    icon={passwordVisible ? faEyeSlash : faEye}
                                    onClick={togglePasswordVisibility}
                                />
                            </div>

                            <div className="form-options">
                                <a href="/forgot-password">
                                    Forgot password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                className={`submit-button ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>

                            <div className="login-footer">
                                <p>Don't have an account? <a href={PAGES.SIGNUP.path}>Sign up here</a></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
