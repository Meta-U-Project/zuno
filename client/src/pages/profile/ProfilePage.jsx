import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profileImage: 'https://i.pravatar.cc/300',
    school: '',
    integrations: {
      canvas: false,
      google: false
    },
    studyPreferences: {
      preferredTimes: []
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const profileResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/profile`, {
          withCredentials: true
        });

        const integrationsResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/integrations`, {
          withCredentials: true
        });

        const preferencesResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/study-preferences`, {
          withCredentials: true
        });

        const combinedData = {
          ...profileResponse.data,
          integrations: {
            canvas: integrationsResponse.data.canvasConnected,
            google: integrationsResponse.data.googleConnected
          },
          studyPreferences: preferencesResponse.data
        };

        setUserData(combinedData);
        setEditedData({...combinedData});
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try again later.');

        if (err.response && err.response.status === 401) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleEditToggle = async () => {
    if (isEditing) {
      setIsSaving(true);
      setSaveError(null);

      try {
        await axios.post(`${import.meta.env.VITE_SERVER_URL}/user/profile`, {
          firstName: editedData.firstName,
          lastName: editedData.lastName,
          school: editedData.school
        }, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        setUserData({...userData, ...editedData});
      } catch (err) {
        console.error('Error saving profile changes:', err);
        setSaveError('Failed to save changes. Please try again.');
        setIsSaving(false);
      }

      setIsSaving(false);
    }

    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData({
      ...editedData,
      [name]: value
    });
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/auth/logout`, {}, {
        withCredentials: true
      });
      navigate('/login');
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const handleStudyPreferences = () => {
    navigate('/dashboard', { state: { openPreferences: true } });
  };

  if (isLoading) {
    return (
      <div className="profile-page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="profile-actions">
          <button
            className={`edit-button ${isEditing ? 'save-mode' : ''}`}
            onClick={handleEditToggle}
            disabled={isSaving}
          >
            {isEditing ? (isSaving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {saveError && (
        <div className="save-error-message">
          {saveError}
        </div>
      )}

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-image-container">
            <img
              src={userData.profileImage}
              alt={`${userData.firstName} ${userData.lastName}`}
              className="profile-image"
            />
            {isEditing && (
              <button className="change-photo-button">
                Change Photo
              </button>
            )}
          </div>

          <div className="integration-status">
            <h3>Connected Accounts</h3>
            <div className="integration-item">
              <span className="integration-name">Canvas</span>
              <span className={`integration-badge ${userData.integrations.canvas ? 'connected' : 'disconnected'}`}>
                {userData.integrations.canvas ? 'Connected' : 'Not Connected'}
              </span>
              {isEditing && (
                <button
                  className="integration-action"
                  onClick={() => navigate('/connect')}
                >
                  {userData.integrations.canvas ? 'Manage' : 'Connect'}
                </button>
              )}
            </div>
            <div className="integration-item">
              <span className="integration-name">Google</span>
              <span className={`integration-badge ${userData.integrations.google ? 'connected' : 'disconnected'}`}>
                {userData.integrations.google ? 'Connected' : 'Not Connected'}
              </span>
              {isEditing && (
                <button
                  className="integration-action"
                  onClick={() => navigate('/connect')}
                >
                  {userData.integrations.google ? 'Manage' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-section">
            <h2>Personal Information</h2>
            <div className="profile-field-group">
              <div className="profile-field">
                <label>First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={editedData.firstName || ''}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{userData.firstName}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={editedData.lastName || ''}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{userData.lastName}</p>
                )}
              </div>
            </div>
            <div className="profile-field">
              <label>Email</label>
              <p>{userData.email}</p>
              {isEditing && <small className="field-note">Email cannot be changed</small>}
            </div>
          </div>

          <div className="profile-section">
            <h2>Academic Information</h2>
            <div className="profile-field">
              <label>University/School</label>
              {isEditing ? (
                <input
                  type="text"
                  name="school"
                  value={editedData.school || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{userData.school || 'Not specified'}</p>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h2>Study Preferences</h2>
            <div className="study-days">
              <h3>Study Days</h3>
              <div className="days-container">
                {userData.studyPreferences.preferredTimes && userData.studyPreferences.preferredTimes.map((day) => (
                  <div
                    key={day.day}
                    className={`day-indicator ${day.enabled ? 'enabled' : 'disabled'}`}
                  >
                    <span className="day-label">{day.day.charAt(0).toUpperCase()}</span>
                  </div>
                ))}
              </div>
              <button className="preferences-button" onClick={handleStudyPreferences}>
                Edit Study Preferences
              </button>
            </div>
          </div>

          <div className="profile-section">
            <h2>Account Settings</h2>
            <div className="account-settings">
              <button
                className="settings-button"
                onClick={() => navigate('/reset-password')}
              >
                Change Password
              </button>
              <button className="settings-button danger">Delete Account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
