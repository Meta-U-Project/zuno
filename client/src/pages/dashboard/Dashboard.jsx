import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Loading from "../../components/Loading";

const Dashboard = () => {
    const navigate = useNavigate();
    const [userFirstName, setUserFirstName] = useState("User");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/user/profile', {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        navigate('/login');
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
                    navigate('/login');
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
            <div className="contact">
                <div className="contact-header">
                    <h1 className="overview-header">welcome, {userFirstName}.</h1>
                    <p className="contact-subtitle">Ready to continue your learning journey? Let's get started!</p>
                </div>

                <div className="contact-content" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px',
                    textAlign: 'center'
                }}>
                    <div className="dashboard-placeholder" style={{
                        background: 'white',
                        padding: '3rem',
                        borderRadius: '20px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #f0f0f0',
                        maxWidth: '600px'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
                        <h2 style={{
                            color: '#333',
                            marginBottom: '1rem',
                            fontSize: '1.5rem'
                        }}>
                            Your Dashboard is Coming Soon!
                        </h2>
                        <p style={{
                            color: '#666',
                            lineHeight: '1.6',
                            fontSize: '1rem'
                        }}>
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
