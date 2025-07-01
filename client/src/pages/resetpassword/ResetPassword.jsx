import React from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./ResetPassword.css";
import Navbar from "../../components/Navbar";
import Loading from "../../components/Loading";
import { PAGES } from "../../utils/constants";


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
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/forgotPassword`, {
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
                navigate(PAGES.LOGIN.path);
            }, 2000);
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {isRedirecting && <Loading message="Email sent, click link in email to complete reset. Redirecting to log in..." />}
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

                            <button
                                type="submit"
                                className={`submit-button ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading}
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
