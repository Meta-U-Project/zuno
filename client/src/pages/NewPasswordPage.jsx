import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import Navbar from "../components/Navbar";

const NewPasswordPage = () => {
    const { id, token } = useParams();
    const navigate = useNavigate();

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
        const response = await fetch(`http://localhost:5000/api/auth/resetPassword/${id}/${token}`, {
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
        setTimeout(() => navigate("/login"), 3000);
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
                    <label htmlFor="newPassword">New Password</label>
                    <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter a new password"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter your new password"
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
