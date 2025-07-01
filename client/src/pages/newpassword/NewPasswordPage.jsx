import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import "./NewPasswordPage.css";
import Loading from "../../components/Loading";
import Navbar from "../../components/Navbar";
import { PAGES } from "../../utils/constants";
const NewPasswordPage = () => {
    const { id, token } = useParams();
    const navigate = useNavigate();

    const [newPasswordVisible, setNewPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    const toggleNewPasswordVisibility = () => {
        setNewPasswordVisible(!newPasswordVisible);
    };

    const toggleConfirmPasswordVisibility = () => {
        setConfirmPasswordVisible(!confirmPasswordVisible);
    };

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
        }

        setIsLoading(true);
        setError("");

        try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/resetPassword/${id}/${token}`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify({ newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong");
        }

        setIsRedirecting(true);
        setTimeout(() => navigate(PAGES.LOGIN.path), 3000);
        } catch (err) {
        setError(err.message || "Something went wrong");
        } finally {
        setIsLoading(false);
        }
    };

    return (
        <div>
        {isRedirecting && <Loading message="Password reset successful! Redirecting to login..." />}
        <Navbar />
        <div className="signup">
            <div className="signup-header-container">
            <div className="signup-header">
                <h1 className="overview-header">Reset your password</h1>
                <p className="contact-subtitle">Enter a new password below.</p>
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
                    <label htmlFor="newPassword">New Password</label>
                    <input
                        type={newPasswordVisible ? 'text' : 'password'}
                        id="newPassword"
                        name="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Enter a new password"
                    />
                    <FontAwesomeIcon
                        icon={newPasswordVisible ? faEyeSlash : faEye}
                        onClick={toggleNewPasswordVisibility}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                        type={confirmPasswordVisible ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-enter your new password"
                    />
                    <FontAwesomeIcon
                        icon={confirmPasswordVisible ? faEyeSlash : faEye}
                        onClick={toggleConfirmPasswordVisibility}
                    />
                </div>

                <button
                    type="submit"
                    className={`submit-button ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                >
                    {isLoading ? "Resetting..." : "Reset Password"}
                </button>
                </form>
            </div>
            </div>
        </div>
        </div>
    );
};

export default NewPasswordPage;
