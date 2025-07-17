import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Sidebar from '../../components/dashboard_components/Sidebar';
import './CalendarPage.css';

const CalendarPage = () => {
    const calendarRef = useRef(null);
    const [currentView, setCurrentView] = useState('dayGridMonth');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const eventColors = {
        assignment: { bg: '#FF0000', border: '#FF0000' },
        quiz: { bg: '#00FF00', border: '#00FF00' },
        discussion: { bg: '#FF69B4', border: '#FF69B4' },
        task_block: { bg: '#FFFF00', border: '#FFFF00' },
    };

    const getEventColor = (type) => {
        return eventColors[type] || eventColors.other;
    };

    useEffect(() => {
        const fetchCalendarEvents = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/canvas/calendarevents`, {
                    withCredentials: true
                });

                if (response.status === 200) {
                    const transformedEvents = response.data.map(event => {
                        const eventType = event.type || 'other';
                        const colors = getEventColor(eventType);

                        return {
                            id: event.id,
                            title: event.title,
                            start: event.date,
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            textColor: '#ffffff',
                            extendedProps: {
                                courseId: event.courseId,
                                courseName: event.courseName,
                                type: eventType
                            }
                        };
                    });

                    setEvents(transformedEvents);
                }
            } catch (err) {
                console.error('Error fetching calendar events:', err);
                setError('Failed to load calendar events. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchCalendarEvents();
    }, []);

    const handleViewChange = (view) => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView(view);
        setCurrentView(view);
    };

    const handleToday = () => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.today();
        setCurrentDate(new Date());
    };

    const handlePrev = () => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.prev();
        const newDate = calendarApi.getDate();
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.next();
        const newDate = calendarApi.getDate();
        setCurrentDate(newDate);
    };

    const handleAddEvent = () => {
        // Placeholder for add event functionality
        console.log('Add Event clicked - Coming soon!');
    };

    const getCurrentTitle = () => {
        const options = {
            year: 'numeric',
            month: 'long'
        };

        if (currentView === 'timeGridDay') {
            return currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else if (currentView === 'timeGridWeek') {
            // For week view, show the week range
            const startOfWeek = new Date(currentDate);
            const day = startOfWeek.getDay();
            startOfWeek.setDate(currentDate.getDate() - day);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
                return `${startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ${startOfWeek.getDate()}-${endOfWeek.getDate()}`;
            } else {
                return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            }
        } else {
            // Month view
            return currentDate.toLocaleDateString('en-US', options);
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="dashboard-main">
                <div className="dashboard-welcome">
                    <div className="welcome-content">
                        <h1>Calendar</h1>
                        <p>Manage your schedule and upcoming events.</p>
                    </div>
                </div>

                <div className="calendar-page">
                    <div className="calendar-header">
                        <div className="calendar-nav">
                            <button className="calendar-nav-button calendar-today-button" onClick={handleToday}>
                                Today
                            </button>
                            <div className="calendar-nav-arrows">
                                <button className="calendar-nav-button calendar-arrow-button" onClick={handlePrev}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                                <button className="calendar-nav-button calendar-arrow-button" onClick={handleNext}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="calendar-current-date">
                                <h2>{getCurrentTitle()}</h2>
                            </div>
                        </div>

                        <div className="calendar-header-right">
                            <button className="calendar-add-event-button" onClick={handleAddEvent}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Add Event
                            </button>

                            <div className="calendar-view-switcher">
                                <button
                                    className={`calendar-view-button ${currentView === 'dayGridMonth' ? 'active' : ''}`}
                                    onClick={() => handleViewChange('dayGridMonth')}
                                >
                                    Month
                                </button>
                                <button
                                    className={`calendar-view-button ${currentView === 'timeGridWeek' ? 'active' : ''}`}
                                    onClick={() => handleViewChange('timeGridWeek')}
                                >
                                    Week
                                </button>
                                <button
                                    className={`calendar-view-button ${currentView === 'timeGridDay' ? 'active' : ''}`}
                                    onClick={() => handleViewChange('timeGridDay')}
                                >
                                    Day
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="calendar-container">
                        {loading ? (
                            <div className="calendar-loading">
                                <div className="loading-spinner"></div>
                                <p>Loading your calendar events...</p>
                            </div>
                        ) : error ? (
                            <div className="calendar-error">
                                <p>{error}</p>
                                <button onClick={() => window.location.reload()}>Try Again</button>
                            </div>
                        ) : (
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={false}
                                events={events}
                                height="auto"
                                aspectRatio={1.8}
                                eventDisplay="block"
                                dayMaxEvents={3}
                                moreLinkClick="popover"
                                eventClick={(info) => {
                                    console.log('Event clicked:', info.event.title);
                                    console.log('Course:', info.event.extendedProps.courseName);
                                    // Placeholder for event click handling
                                }}
                                dateClick={(info) => {
                                    console.log('Date clicked:', info.dateStr);
                                    // Placeholder for date click handling
                                }}
                                eventDidMount={(info) => {
                                    // Create custom tooltip with more detailed information
                                    const event = info.event;
                                    const courseName = event.extendedProps.courseName || 'No course';
                                    const eventType = event.extendedProps.type || 'Other';

                                    // Create tooltip element
                                    const tooltip = document.createElement('div');
                                    tooltip.className = 'event-detailed-tooltip';
                                    tooltip.innerHTML = `
                                        <div class="tooltip-header" style="background: ${event.backgroundColor}">
                                            <div class="tooltip-type">${eventType.toUpperCase()}</div>
                                            <div class="tooltip-title">${event.title}</div>
                                        </div>
                                        <div class="tooltip-body">
                                            <div class="tooltip-detail">
                                                <span class="tooltip-label">Course:</span>
                                                <span class="tooltip-value">${courseName}</span>
                                            </div>
                                            <div class="tooltip-detail">
                                                <span class="tooltip-label">Date:</span>
                                                <span class="tooltip-value">${new Date(event.start).toLocaleString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })}</span>
                                            </div>
                                        </div>
                                    `;

                                    // Position tooltip and handle hover events
                                    document.body.appendChild(tooltip);
                                    tooltip.style.position = 'absolute';
                                    tooltip.style.display = 'none';
                                    tooltip.style.zIndex = 10000;

                                    // Show tooltip on hover
                                    info.el.addEventListener('mouseenter', () => {
                                        const rect = info.el.getBoundingClientRect();
                                        tooltip.style.left = `${rect.left + window.scrollX}px`;
                                        tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
                                        tooltip.style.display = 'block';
                                    });

                                    // Hide tooltip when mouse leaves
                                    info.el.addEventListener('mouseleave', () => {
                                        tooltip.style.display = 'none';
                                    });

                                    // Clean up tooltip when event is removed
                                    info.el.addEventListener('remove', () => {
                                        if (tooltip && tooltip.parentNode) {
                                            tooltip.parentNode.removeChild(tooltip);
                                        }
                                    });
                                }}
                                noEventsContent={() => (
                                    <div className="no-events-message">
                                        <p>No events to display</p>
                                    </div>
                                )}
                            />
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
