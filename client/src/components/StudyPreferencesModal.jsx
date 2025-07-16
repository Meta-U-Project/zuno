import { useState } from 'react';
import './StudyPreferencesModal.css';

const StudyPreferencesModal = ({ isOpen, onClose, onSave }) => {
    const [preferences, setPreferences] = useState({
        startOfDay: '09:00',
        endOfDay: '20:00',
        preferredTimes: [
            { day: 'monday', startTime: '09:00', endTime: '17:00', enabled: true },
            { day: 'tuesday', startTime: '09:00', endTime: '17:00', enabled: true },
            { day: 'wednesday', startTime: '09:00', endTime: '17:00', enabled: true },
            { day: 'thursday', startTime: '09:00', endTime: '17:00', enabled: true },
            { day: 'friday', startTime: '09:00', endTime: '17:00', enabled: true },
            { day: 'saturday', startTime: '10:00', endTime: '16:00', enabled: false },
            { day: 'sunday', startTime: '10:00', endTime: '16:00', enabled: false }
        ]
    });

    const handleDayToggle = (index) => {
        const updatedPreferences = { ...preferences };
        updatedPreferences.preferredTimes[index].enabled = !updatedPreferences.preferredTimes[index].enabled;
        setPreferences(updatedPreferences);
    };

    const handleTimeChange = (index, field, value) => {
        const updatedPreferences = { ...preferences };
        updatedPreferences.preferredTimes[index][field] = value;
        setPreferences(updatedPreferences);
    };

    const handleDayTimeChange = (field, value) => {
        setPreferences({
        ...preferences,
        [field]: value
        });
    };

    const handleSave = () => {
        const filteredPreferences = {
            ...preferences,
            preferredTimes: preferences.preferredTimes.filter(time => time.enabled)
        };
        onSave(filteredPreferences);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Study Preferences</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="preferences-section">
                        <h3>Daily Study Hours</h3>
                        <div className="time-range-container">
                            <div className="time-input-group">
                                <label>Start of Day</label>
                                <input
                                    type="time"
                                    value={preferences.startOfDay}
                                    onChange={(e) => handleDayTimeChange('startOfDay', e.target.value)}
                                />
                            </div>
                            <div className="time-input-group">
                                <label>End of Day</label>
                                <input
                                    type="time"
                                    value={preferences.endOfDay}
                                    onChange={(e) => handleDayTimeChange('endOfDay', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="preferences-section">
                        <h3>Preferred Study Times</h3>
                        <p className="section-description">Select your preferred study times for each day of the week.</p>

                        <div className="days-container">
                            {preferences.preferredTimes.map((dayPreference, index) => (
                                <div key={dayPreference.day} className={`day-preference ${dayPreference.enabled ? 'enabled' : 'disabled'}`}>
                                    <div className="day-header">
                                        <label className="day-toggle">
                                        <input
                                            type="checkbox"
                                            checked={dayPreference.enabled}
                                            onChange={() => handleDayToggle(index)}
                                        />
                                        <span className="day-name">{dayPreference.day.charAt(0).toUpperCase() + dayPreference.day.slice(1)}</span>
                                        </label>
                                    </div>

                                    {dayPreference.enabled && (
                                        <div className="day-times">
                                            <div className="time-input-group">
                                                <label>From</label>
                                                <input
                                                type="time"
                                                value={dayPreference.startTime}
                                                onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                                                />
                                            </div>
                                            <div className="time-input-group">
                                                <label>To</label>
                                                <input
                                                    type="time"
                                                    value={dayPreference.endTime}
                                                    onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        </div>
                            </div>
                                <div className="modal-footer">
                                    <button className="cancel-button" onClick={onClose}>Cancel</button>
                                    <button className="save-button" onClick={handleSave}>Save Preferences</button>
                                </div>
                            </div>
                        </div>
    );
};

export default StudyPreferencesModal;
