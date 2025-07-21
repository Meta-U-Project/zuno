import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Dashboard.css";
import Loading from "../../components/Loading";
import { PAGES } from "../../utils/constants";
import DashboardLayout from "../../components/dashboard_components/DashboardLayout";
import Sidebar from "../../components/dashboard_components/Sidebar";
import StudyPreferencesModal from "../../components/dashboard_components/StudyPreferencesModal";
import WelcomeHeader from "../../components/dashboard_components/WelcomeHeader";

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userFirstName, setUserFirstName] = useState("User");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showPreferencesModal, setShowPreferencesModal] = useState(false);
    const [preferencesSaved, setPreferencesSaved] = useState(false);

    const handleSettings = () => {
        console.log('Settings clicked - Coming soon!');
        // Future settings functionality
    };

    const handleSavePreferences = (_preferences) => {
        setPreferencesSaved(true);

        setTimeout(() => {
            setPreferencesSaved(false);
        }, 3000);
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

                const hasPreferences = userData.hasPreferences;

                const isFromSignup = location.state?.fromSignup;
                const openPreferences = location.state?.openPreferences;

                if (isFromSignup || !hasPreferences || openPreferences) {
                    setShowPreferencesModal(true);
                }
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
    }, [navigate, location.state]);


    if (isLoading) {
        return <Loading message="Loading your dashboard..." />;
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <div className="error-content">
                    <h1>Error</h1>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="dashboard-main">
                <WelcomeHeader
                    title={`Welcome back, ${userFirstName}!`}
                    subtitle="Here's what's happening with your studies today."
                    onSettingsClick={handleSettings}
                />
                <DashboardLayout />
            </div>

            <StudyPreferencesModal
                isOpen={showPreferencesModal}
                onClose={() => setShowPreferencesModal(false)}
                onSave={handleSavePreferences}
            />

            {preferencesSaved && (
                <div className="preferences-saved-notification">
                    <div className="notification-content">
                        <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                        </svg>
                        <span>Preferences saved successfully!</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
