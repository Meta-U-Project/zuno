import React from "react";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import { useNavigate } from "react-router-dom";
import { useState } from "react";


const ResetPassword = () => {
    const [formData, setFormData] = useState({
            email: ''
        });
    const navigate = useNavigate();
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
            const response = await fetch('http://localhost:5000/api/auth/forgotPassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Couldn\'t reset password');
            }

            setIsLoading(false);
            setIsRedirecting(true);

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {isRedirecting && <Loading message="Account created successfully! Redirecting to login..." />}
            <Navbar />
            <div className="signup">
                <div className="signup-header-container">
                    <div className="signup-header">
                        <h1 className="overview-header">forgot your password?</h1>
                        <p className="contact-subtitle">enter your email address to reset it.</p>
                    </div>
                </div>

                <div className="signup-content">
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

                            <button
                                type="submit"
                                className="submit-button"
                                disabled={isLoading}
                                style={{
                                    opacity: isLoading ? 0.7 : 1,
                                    cursor: isLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
