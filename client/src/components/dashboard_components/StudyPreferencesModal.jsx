import { useState, useEffect } from 'react';
import axios from 'axios';
import './StudyPreferencesModal.css';

const StudyPreferencesModal = ({ isOpen, onClose, onSave }) => {
    const [preferences, setPreferences] = useState({
        dailyHours: [
            { day: 'default', startTime: '09:00', endTime: '20:00' }
        ],
        preferredTimes: [
            { day: 'monday', enabled: true, timeRanges: [{ startTime: '09:00', endTime: '17:00' }] },
            { day: 'tuesday', enabled: true, timeRanges: [{ startTime: '09:00', endTime: '17:00' }] },
            { day: 'wednesday', enabled: true, timeRanges: [{ startTime: '09:00', endTime: '17:00' }] },
            { day: 'thursday', enabled: true, timeRanges: [{ startTime: '09:00', endTime: '17:00' }] },
            { day: 'friday', enabled: true, timeRanges: [{ startTime: '09:00', endTime: '17:00' }] },
            { day: 'saturday', enabled: false, timeRanges: [{ startTime: '10:00', endTime: '16:00' }] },
            { day: 'sunday', enabled: false, timeRanges: [{ startTime: '10:00', endTime: '16:00' }] }
        ]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchStudyPreferences();
        }
    }, [isOpen]);

    const fetchStudyPreferences = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/study-preferences`, {
                withCredentials: true
            });

            if (response.data) {
                setPreferences(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch study preferences:', err);
            setError('Failed to load your study preferences. Using defaults.');
        } finally {
            setLoading(false);
        }
    };

    const handleDayToggle = (index) => {
        const updatedPreferences = { ...preferences };
        updatedPreferences.preferredTimes[index].enabled = !updatedPreferences.preferredTimes[index].enabled;
        setPreferences(updatedPreferences);
    };

    const handleTimeChange = (dayIndex, timeIndex, field, value) => {
        const updatedPreferences = { ...preferences };
        updatedPreferences.preferredTimes[dayIndex].timeRanges[timeIndex][field] = value;
        setPreferences(updatedPreferences);
    };

    const addTimeRange = (dayIndex) => {
        const updatedPreferences = { ...preferences };
        updatedPreferences.preferredTimes[dayIndex].timeRanges.push({
            startTime: '09:00',
            endTime: '17:00'
        });
        setPreferences(updatedPreferences);
    };

    const removeTimeRange = (dayIndex, timeIndex) => {
        if (preferences.preferredTimes[dayIndex].timeRanges.length <= 1) return; // Don't remove the last one
        const updatedPreferences = { ...preferences };
        updatedPreferences.preferredTimes[dayIndex].timeRanges.splice(timeIndex, 1);
        setPreferences(updatedPreferences);
    };

    const handleDailyHoursChange = (index, field, value) => {
        const updatedPreferences = { ...preferences };
        updatedPreferences.dailyHours[index][field] = value;
        setPreferences(updatedPreferences);
    };

    const addDailyHours = () => {
        const updatedPreferences = { ...preferences };
        updatedPreferences.dailyHours.push({ day: 'monday', startTime: '09:00', endTime: '20:00' });
        setPreferences(updatedPreferences);
    };

    const removeDailyHours = (index) => {
        if (preferences.dailyHours.length <= 1) return;
        const updatedPreferences = { ...preferences };
        updatedPreferences.dailyHours.splice(index, 1);
        setPreferences(updatedPreferences);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError(null);

            const filteredPreferences = {
                dailyHours: preferences.dailyHours.filter(hours => hours.day === 'default'), // Only keep default hours
                preferredTimes: preferences.preferredTimes.filter(time => time.enabled)
            };

            await axios.post(`${import.meta.env.VITE_SERVER_URL}/user/study-preferences`, filteredPreferences, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });

            onSave(filteredPreferences);
            onClose();
        } catch (err) {
            console.error('Failed to save study preferences:', err);
            setError('Failed to save your study preferences. Please try again.');
            setLoading(false);
        }
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
                        <h3>Daily Hours</h3>
                        <p className="section-description">When do you start and end your day? You can add multiple time ranges if needed.</p>

                        {preferences.dailyHours.map((hours, index) => (
                            <div key={index} className="time-range-container">
                                {index > 0 && (
                                    <div className="time-input-group day-select">
                                        <label>Day</label>
                                        <select
                                            value={hours.day}
                                            onChange={(e) => handleDailyHoursChange(index, 'day', e.target.value)}
                                        >
                                            <option value="monday">Monday</option>
                                            <option value="tuesday">Tuesday</option>
                                            <option value="wednesday">Wednesday</option>
                                            <option value="thursday">Thursday</option>
                                            <option value="friday">Friday</option>
                                            <option value="saturday">Saturday</option>
                                            <option value="sunday">Sunday</option>
                                        </select>
                                    </div>
                                )}
                                <div className="time-input-group">
                                    <label>{index === 0 ? 'Default Start of Day' : 'Start of Day'}</label>
                                    <input
                                        type="time"
                                        value={hours.startTime}
                                        onChange={(e) => handleDailyHoursChange(index, 'startTime', e.target.value)}
                                    />
                                </div>
                                <div className="time-input-group">
                                    <label>{index === 0 ? 'Default End of Day' : 'End of Day'}</label>
                                    <input
                                        type="time"
                                        value={hours.endTime}
                                        onChange={(e) => handleDailyHoursChange(index, 'endTime', e.target.value)}
                                    />
                                </div>
                                {index > 0 && (
                                    <button
                                        type="button"
                                        className="remove-button"
                                        onClick={() => removeDailyHours(index)}
                                        aria-label="Remove time range"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            className="add-button"
                            onClick={addDailyHours}
                        >
                            Have different daily schedules? Add another time range
                        </button>
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
                                            <span className="checkbox-custom"></span>
                                            <span className="day-name">{dayPreference.day.charAt(0).toUpperCase() + dayPreference.day.slice(1)}</span>
                                        </label>
                                    </div>

                                    {dayPreference.enabled && (
                                        <>
                                            {dayPreference.timeRanges.map((timeRange, timeIndex) => (
                                                <div key={timeIndex} className="day-time-range">
                                                    <div className="day-times">
                                                        <div className="time-input-group">
                                                            <label>From</label>
                                                            <input
                                                                type="time"
                                                                value={timeRange.startTime}
                                                                onChange={(e) => handleTimeChange(index, timeIndex, 'startTime', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="time-input-group">
                                                            <label>To</label>
                                                            <input
                                                                type="time"
                                                                value={timeRange.endTime}
                                                                onChange={(e) => handleTimeChange(index, timeIndex, 'endTime', e.target.value)}
                                                            />
                                                        </div>
                                                        {timeIndex > 0 && (
                                                            <button
                                                                type="button"
                                                                className="remove-time-button"
                                                                onClick={() => removeTimeRange(index, timeIndex)}
                                                                aria-label="Remove time range"
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                className="add-time-button"
                                                onClick={() => addTimeRange(index)}
                                            >
                                                + Add another time slot
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                        </div>
                            </div>
                                {error && (
                                    <div className="error-message">
                                        {error}
                                    </div>
                                )}

                                <div className="modal-footer">
                                    <button className="cancel-button" onClick={onClose} disabled={loading}>Cancel</button>
                                    <button className="save-button" onClick={handleSave} disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Preferences'}
                                    </button>
                                </div>
                            </div>
                        </div>
    );
};

export default StudyPreferencesModal;
