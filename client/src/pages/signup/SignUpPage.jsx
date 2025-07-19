import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignUpPage.css";
import Navbar from "../../components/Navbar";
import Loading from "../../components/Loading";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { PAGES } from "../../utils/constants";

const SignUpPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        school: '',
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
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create account');
            }

            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                school: '',
                password: ''
            });

            setIsLoading(false);
            setIsRedirecting(true);

            try {
                const loginResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password
                    }),
                });

                if (loginResponse.ok) {
                    setTimeout(() => {
                        navigate('/connect', { state: { fromSignup: true } });
                    }, 2000);
                } else {
                    setTimeout(() => {
                        navigate('/login');
                    }, 2000);
                }
            } catch (loginErr) {
                console.error('Auto-login error:', loginErr);
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }

        } catch (err) {
            console.error('Sign up error:', err);
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {isRedirecting && <Loading message="Account created successfully! Redirecting you to connect your accounts..." />}
            <Navbar />
            <div className="signup">
                <div className="signup-header-container">
                    <div className="signup-header">
                        <h1 className="overview-header">try zuno.</h1>
                        <p className="contact-subtitle">Sign up for a zuno account to start your learning journey.</p>
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
                                <label htmlFor="firstName">First Name</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Jane"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName">Last Name</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Doe"
                                />
                            </div>

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
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    placeholder="(555) 123-4567"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="school">School</label>
                                <input
                                    type="text"
                                    id="school"
                                    name="school"
                                    value={formData.school}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your school name"
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
                                <label>
                                    <input type="checkbox" required />
                                    I agree to the Terms of Service and Privacy Policy
                                </label>
                            </div>

                            <button
                                type="submit"
                                className={`submit-button ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating Account...' : 'Sign Up'}
                            </button>

                            <div className="login-footer">
                                <p>Already have an account? <a href={PAGES.LOGIN.path}>Log in here</a></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;
