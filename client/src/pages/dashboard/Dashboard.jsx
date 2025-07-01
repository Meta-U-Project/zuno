import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Navbar from "../../components/Navbar";
import Loading from "../../components/Loading";
import { PAGES } from "../../utils/constants";

const Dashboard = () => {
    const navigate = useNavigate();
    const [userFirstName, setUserFirstName] = useState("User");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const handleLogout = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                navigate(PAGES.LOGIN.path);
            } else {
                throw new Error('Failed to log out');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            setError('Failed to log out');
        }
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/user/profile`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        navigate(PAGES.LOGIN.path);
                        return;
                    }
                    throw new Error('Failed to fetch user profile');
                }

                const userData = await response.json();
                setUserFirstName(userData.firstName || "User");
            } catch (error) {
                console.error('Error fetching user profile:', error);
                setError('Failed to load user profile');
                setTimeout(() => {
                    navigate(PAGES.LOGIN.path);
                }, 2000);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();
    }, [navigate]);

    if (isLoading) {
        return <Loading message="Loading your dashboard..." />;
    }

    if (error) {
        return (
            <div>
                <Navbar />
                <div className="contact">
                    <div className="contact-header">
                        <h1 className="overview-header">Error</h1>
                        <p className="contact-subtitle">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <button className="logout" onClick={handleLogout}>Logout</button>
            <div className="contact">
                <div className="contact-header">
                    <h1 className="overview-header">welcome, {userFirstName}.</h1>
                    <p className="contact-subtitle">Ready to continue your learning journey? Let's get started!</p>
                </div>

                <div className="contact-content">
                    <div className="dashboard-placeholder">
                        <div className="dashboard-icon">📚</div>
                        <h2 className="dashboard-title">
                            Your Dashboard is Coming Soon!
                        </h2>
                        <p className="dashboard-description">
                            We're working hard to build an amazing dashboard experience for you.
                            Soon you'll be able to track your progress, manage your study materials,
                            and connect with your study groups all from here.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
