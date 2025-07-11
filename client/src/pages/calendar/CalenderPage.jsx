import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './CalendarPage.css';

const CalendarPage = () => {
    const calendarRef = useRef(null);
    const [currentView, setCurrentView] = useState('dayGridMonth');

    // Placeholder events for demonstration
    const events = [
        {
            id: '1',
            title: 'Math Assignment Due',
            start: '2025-01-15T23:59:00',
            backgroundColor: '#7735e2',
            borderColor: '#7735e2',
            textColor: '#ffffff'
        },
        {
            id: '2',
            title: 'Physics Lab',
            start: '2025-01-16T14:00:00',
            end: '2025-01-16T16:00:00',
            backgroundColor: '#0a63ac',
            borderColor: '#0a63ac',
            textColor: '#ffffff'
        },
        {
            id: '3',
            title: 'Study Group',
            start: '2025-01-17T18:00:00',
            end: '2025-01-17T20:00:00',
            backgroundColor: '#28a745',
            borderColor: '#28a745',
            textColor: '#ffffff'
        },
        {
            id: '4',
            title: 'Chemistry Exam',
            start: '2025-01-20T10:00:00',
            end: '2025-01-20T12:00:00',
            backgroundColor: '#dc3545',
            borderColor: '#dc3545',
            textColor: '#ffffff'
        },
        {
            id: '5',
            title: 'Project Presentation',
            start: '2025-01-22T15:30:00',
            end: '2025-01-22T16:30:00',
            backgroundColor: '#fd7e14',
            borderColor: '#fd7e14',
            textColor: '#ffffff'
        }
    ];

    const handleViewChange = (view) => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView(view);
        setCurrentView(view);
    };

    const handleToday = () => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.today();
    };

    const handlePrev = () => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.prev();
    };

    const handleNext = () => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.next();
    };

    const handleAddEvent = () => {
        // Placeholder for add event functionality
        console.log('Add Event clicked - Coming soon!');
    };

    const getViewButtonText = (view) => {
        switch (view) {
            case 'dayGridMonth':
                return 'Month';
            case 'timeGridWeek':
                return 'Week';
            case 'timeGridDay':
                return 'Day';
            default:
                return 'Month';
        }
    };

    return (
        <div className="calendar-page">
            <div className="calendar-header">
                <div className="calendar-nav">
                    <button className="nav-button today-button" onClick={handleToday}>
                        Today
                    </button>
                    <div className="nav-arrows">
                        <button className="nav-button arrow-button" onClick={handlePrev}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                        <button className="nav-button arrow-button" onClick={handleNext}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="calendar-title">
                    <h1 id="calendar-title">Calendar</h1>
                </div>

                <div className="view-switcher">
                    <button
                        className={`view-button ${currentView === 'dayGridMonth' ? 'active' : ''}`}
                        onClick={() => handleViewChange('dayGridMonth')}
                    >
                        Month
                    </button>
                    <button
                        className={`view-button ${currentView === 'timeGridWeek' ? 'active' : ''}`}
                        onClick={() => handleViewChange('timeGridWeek')}
                    >
                        Week
                    </button>
                    <button
                        className={`view-button ${currentView === 'timeGridDay' ? 'active' : ''}`}
                        onClick={() => handleViewChange('timeGridDay')}
                    >
                        Day
                    </button>
                </div>
            </div>

            <div className="calendar-container">
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
                        // Placeholder for event click handling
                    }}
                    dateClick={(info) => {
                        console.log('Date clicked:', info.dateStr);
                        // Placeholder for date click handling
                    }}
                    eventDidMount={(info) => {
                        // Add custom styling or tooltips if needed
                        info.el.setAttribute('title', info.event.title);
                    }}
                />
            </div>

            <button className="add-event-button" onClick={handleAddEvent}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Add Event
            </button>
        </div>
    );
};

export default CalendarPage;
