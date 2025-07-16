import React, { useState, useRef } from 'react';
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

    // Placeholder events for demonstration
    const events = [
        {
            id: '1',
            title: 'Math Assignment Due',
            start: '2025-07-15T23:59:00',
            backgroundColor: '#7735e2',
            borderColor: '#7735e2',
            textColor: '#ffffff'
        },
        {
            id: '2',
            title: 'Physics Lab',
            start: '2025-07-16T14:00:00',
            end: '2025-07-16T16:00:00',
            backgroundColor: '#0a63ac',
            borderColor: '#0a63ac',
            textColor: '#ffffff'
        },
        {
            id: '3',
            title: 'Study Group',
            start: '2025-07-17T18:00:00',
            end: '2025-07-17T20:00:00',
            backgroundColor: '#28a745',
            borderColor: '#28a745',
            textColor: '#ffffff'
        },
        {
            id: '4',
            title: 'Chemistry Exam',
            start: '2025-07-20T10:00:00',
            end: '2025-07-20T12:00:00',
            backgroundColor: '#dc3545',
            borderColor: '#dc3545',
            textColor: '#ffffff'
        },
        {
            id: '5',
            title: 'Project Presentation',
            start: '2025-07-22T15:30:00',
            end: '2025-07-22T16:30:00',
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

                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
