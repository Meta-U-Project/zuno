import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();

  // Hardcoded user data
  const [userData, setUserData] = useState({
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@university.edu',
    profileImage: 'https://i.pravatar.cc/300',
    university: 'State University',
    major: 'Computer Science',
    graduationYear: '2025',
    integrations: {
      canvas: true,
      google: true
    },
    studyPreferences: {
      preferredTimes: [
        { day: 'monday', enabled: true },
        { day: 'tuesday', enabled: true },
        { day: 'wednesday', enabled: true },
        { day: 'thursday', enabled: true },
        { day: 'friday', enabled: true },
        { day: 'saturday', enabled: false },
        { day: 'sunday', enabled: false }
      ]
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({...userData});

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      setUserData({...editedData});
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

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="profile-actions">
          <button
            className={`edit-button ${isEditing ? 'save-mode' : ''}`}
            onClick={handleEditToggle}
          >
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

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
                <button className="integration-action">
                  {userData.integrations.canvas ? 'Disconnect' : 'Connect'}
                </button>
              )}
            </div>
            <div className="integration-item">
              <span className="integration-name">Google</span>
              <span className={`integration-badge ${userData.integrations.google ? 'connected' : 'disconnected'}`}>
                {userData.integrations.google ? 'Connected' : 'Not Connected'}
              </span>
              {isEditing && (
                <button className="integration-action">
                  {userData.integrations.google ? 'Disconnect' : 'Connect'}
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
                    value={editedData.firstName}
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
                    value={editedData.lastName}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{userData.lastName}</p>
                )}
              </div>
            </div>
            <div className="profile-field">
              <label>Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={editedData.email}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{userData.email}</p>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h2>Academic Information</h2>
            <div className="profile-field">
              <label>University</label>
              {isEditing ? (
                <input
                  type="text"
                  name="university"
                  value={editedData.university}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{userData.university}</p>
              )}
            </div>
            <div className="profile-field-group">
              <div className="profile-field">
                <label>Major</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="major"
                    value={editedData.major}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{userData.major}</p>
                )}
              </div>
              <div className="profile-field">
                <label>Graduation Year</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="graduationYear"
                    value={editedData.graduationYear}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{userData.graduationYear}</p>
                )}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>Study Preferences</h2>
            <div className="study-days">
              <h3>Study Days</h3>
              <div className="days-container">
                {userData.studyPreferences.preferredTimes.map((day) => (
                  <div
                    key={day.day}
                    className={`day-indicator ${day.enabled ? 'enabled' : 'disabled'}`}
                  >
                    <span className="day-label">{day.day.charAt(0).toUpperCase()}</span>
                  </div>
                ))}
              </div>
              <button className="preferences-button">
                Edit Study Preferences
              </button>
            </div>
          </div>

          <div className="profile-section">
            <h2>Account Settings</h2>
            <div className="account-settings">
              <button className="settings-button">Change Password</button>
              <button className="settings-button danger">Delete Account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
