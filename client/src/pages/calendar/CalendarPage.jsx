import { useState, useRef, useEffect, useCallback } from 'react';
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

    const [studyBlocks, setStudyBlocks] = useState([]);
    const [showStudyBlocksModal, setShowStudyBlocksModal] = useState(false);
    const [hasUnsavedBlocks, setHasUnsavedBlocks] = useState(false);
    const [taskBlocksMap, setTaskBlocksMap] = useState({});
    const [selectedBlocks, setSelectedBlocks] = useState({});

    const eventColors = {
        assignment: { bg: '#FF0000', border: '#FF0000' },
        quiz: { bg: '#00FF00', border: '#00FF00' },
        discussion: { bg: '#FF69B4', border: '#FF69B4' },
        task_block: { bg: '#808080', border: '#808080' },
        class_session: { bg: '#1c79de', border: '#1c79de' },
    };

    const getEventColor = (type) => {
        return eventColors[type] || { bg: '#808080', border: '#808080' }; // Default gray color for unknown event types
    };

    const fetchCalendarEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const eventsResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/canvas/calendarevents`, {
                withCredentials: true
            });

            const classSessionsResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/canvas/classsessions`, {
                withCredentials: true
            });

            if (eventsResponse.status === 200 && classSessionsResponse.status === 200) {
                const transformedEvents = eventsResponse.data.map(event => {
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

                const transformedClassSessions = classSessionsResponse.data.map(session => {
                    const colors = getEventColor('class_session');

                    return {
                        id: `class_${session.id}`,
                        title: session.title,
                        start: session.start_time,
                        end: session.end_time,
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                        textColor: '#ffffff',
                        extendedProps: {
                            courseId: session.courseId,
                            courseName: session.courseName,
                            type: 'class_session',
                            location: session.location
                        }
                    };
                });

                // Combine both types of events
                setEvents([...transformedEvents, ...transformedClassSessions]);
            }
        } catch (err) {
            console.error('Error fetching calendar events:', err);
            setError('Failed to load calendar events. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, []);

    const checkForTasksNeedingScheduling = useCallback(async () => {
        try {
            const checkResponse = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/task/need-scheduling`,
                { withCredentials: true }
            );

            if (checkResponse.status === 200 && checkResponse.data.needsScheduling) {
                await generateStudyBlocks();
            }
        } catch (err) {
            console.error('Error checking for tasks that need scheduling:', err);
        }
    }, []);

    const generateStudyBlocks = useCallback(async () => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/task/schedule`,
                { schedulingPeriodDays: 14, saveToCalendar: false },
                { withCredentials: true }
            );

            if (response.status === 200 && response.data.success) {
                const blocksByTask = {};
                const allBlocks = [];

                response.data.tasks.forEach(task => {
                    if (task.blocks && task.blocks.length > 0) {
                        blocksByTask[task.id] = {
                            taskId: task.id,
                            taskTitle: task.title,
                            blocks: task.blocks,
                            selected: true
                        };

                        task.blocks.forEach(block => {
                            const blockId = `${task.id}-${new Date(block.start_time).getTime()}`;
                            if (!selectedBlocks[blockId]) {
                                setSelectedBlocks(prev => ({
                                    ...prev,
                                    [blockId]: true
                                }));
                            }
                        });

                        const taskBlocks = task.blocks.map(block => {
                            const startTime = new Date(block.start_time);
                            const formattedTime = startTime.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            });

                            const formattedDate = startTime.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            });

                            return {
                                id: `pending-${task.id}-${block.start_time}`,
                                title: `Study Block for ${task.title} (${formattedTime})`,
                                start: block.start_time,
                                end: block.end_time,
                                backgroundColor: getEventColor('task_block').bg,
                                borderColor: getEventColor('task_block').border,
                                textColor: '#000000',
                                extendedProps: {
                                    taskId: task.id,
                                    taskTitle: task.title,
                                    type: 'task_block',
                                    isPending: true,
                                    duration: block.duration,
                                    formattedDate: formattedDate,
                                    formattedTime: formattedTime
                                },
                                display: 'block',
                                classNames: ['pending-study-block']
                            };
                        });

                        allBlocks.push(...taskBlocks);
                    }
                });

                setTaskBlocksMap(blocksByTask);
                setStudyBlocks(allBlocks);

                if (allBlocks.length > 0) {
                    setShowStudyBlocksModal(true);
                    setHasUnsavedBlocks(true);
                }
            }
        } catch (err) {
            console.error('Error generating study blocks:', err);
        }
    }, []);

    useEffect(() => {
        fetchCalendarEvents();
        checkForTasksNeedingScheduling();

        const handleBeforeUnload = (e) => {
            if (hasUnsavedBlocks) {
                const message = 'You have unsaved study blocks. If you leave now, they will be discarded.';
                e.returnValue = message;
                return message;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [fetchCalendarEvents, checkForTasksNeedingScheduling, hasUnsavedBlocks]);

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
        //
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
                                events={[...events, ...studyBlocks]}
                                height="auto"
                                aspectRatio={1.8}
                                eventDisplay="block"
                                dayMaxEvents={3}
                                moreLinkClick="popover"


                                eventDidMount={(info) => {
                                    const event = info.event;
                                    const isPending = event.extendedProps.isPending;
                                    const courseName = event.extendedProps.courseName || 'No course';
                                    const eventType = event.extendedProps.type || 'Other';

                                    if (isPending) {
                                        info.el.style.opacity = '0.7';
                                        info.el.style.border = '2px dashed #000';
                                    }

                                    const tooltip = document.createElement('div');
                                    tooltip.className = 'event-detailed-tooltip';

                                    let tooltipContent = `
                                        <div class="tooltip-header" style="background: ${event.backgroundColor}">
                                            <div class="tooltip-type">${eventType.toUpperCase()}</div>
                                            <div class="tooltip-title">${event.title}</div>
                                        </div>
                                        <div class="tooltip-body">
                                    `;

                                    if (isPending) {
                                        tooltipContent += `
                                            <div class="tooltip-detail tooltip-pending">
                                                <span class="tooltip-label">Status:</span>
                                                <span class="tooltip-value">Pending Confirmation</span>
                                            </div>
                                        `;
                                    }

                                    if (event.extendedProps.taskTitle) {
                                        tooltipContent += `
                                            <div class="tooltip-detail">
                                                <span class="tooltip-label">Task:</span>
                                                <span class="tooltip-value">${event.extendedProps.taskTitle}</span>
                                            </div>
                                        `;
                                    }

                                    if (courseName !== 'No course') {
                                        tooltipContent += `
                                            <div class="tooltip-detail">
                                                <span class="tooltip-label">Course:</span>
                                                <span class="tooltip-value">${courseName}</span>
                                            </div>
                                        `;
                                    }

                                    if (event.extendedProps.location) {
                                        tooltipContent += `
                                            <div class="tooltip-detail">
                                                <span class="tooltip-label">Location:</span>
                                                <span class="tooltip-value">${event.extendedProps.location}</span>
                                            </div>
                                        `;
                                    }

                                    tooltipContent += `
                                            <div class="tooltip-detail">
                                                <span class="tooltip-label">Date:</span>
                                                <span class="tooltip-value">${new Date(event.start).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}</span>
                                            </div>
                                            <div class="tooltip-detail">
                                                <span class="tooltip-label">Time:</span>
                                                <span class="tooltip-value">
                                                    ${event.end && new Date(event.start).getTime() !== new Date(event.end).getTime() ? `
                                                    ${new Date(event.start).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })} - ${new Date(event.end).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                    ` : `
                                                    <strong>Deadline:</strong> ${new Date(event.start).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                    `}
                                                </span>
                                            </div>
                                    `;

                                    if (event.extendedProps.duration) {
                                        tooltipContent += `
                                            <div class="tooltip-detail">
                                                <span class="tooltip-label">Duration:</span>
                                                <span class="tooltip-value">${event.extendedProps.duration} minutes</span>
                                            </div>
                                        `;
                                    }

                                    tooltipContent += `</div>`;
                                    tooltip.innerHTML = tooltipContent;

                                    document.body.appendChild(tooltip);
                                    tooltip.style.position = 'absolute';
                                    tooltip.style.display = 'none';
                                    tooltip.style.zIndex = 10000;

                                    info.el.addEventListener('mouseenter', () => {
                                        const rect = info.el.getBoundingClientRect();
                                        tooltip.style.left = `${rect.left + window.scrollX}px`;
                                        const tooltipWidth = tooltip.offsetWidth;
                                        const windowWidth = window.innerWidth;


                                        let leftPos = rect.left + window.scrollX;
                                        if (leftPos + tooltipWidth > windowWidth - 20) {
                                            leftPos = windowWidth - tooltipWidth - 20;
                                        }

                                        tooltip.style.left = `${leftPos}px`;
                                        tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
                                        tooltip.style.display = 'block';
                                    });

                                    info.el.addEventListener('mouseleave', () => {
                                        tooltip.style.display = 'none';
                                    });

                                    info.el.addEventListener('remove', () => {
                                        if (tooltip && tooltip.parentNode) {
                                            tooltip.parentNode.removeChild(tooltip);
                                        }
                                    });
                                }}
                                noEventsText="No events to display"
                            />
                        )}
                    </div>

                    {showStudyBlocksModal && (
                        <div className="study-blocks-modal-overlay">
                            <div className="study-blocks-modal">
                                <div className="study-blocks-modal-header">
                                    <h2>Confirm Study Blocks</h2>
                                    <button
                                        className="close-button"
                                        onClick={() => setShowStudyBlocksModal(false)}
                                    >
                                        &times;
                                    </button>
                                </div>
                                <div className="study-blocks-modal-content">
                                    <p>Our algorithm has generated study blocks for your upcoming tasks. Please review and confirm them.</p>

                                    {Object.values(taskBlocksMap).length > 0 ? (
                                        <div className="study-blocks-list">
                                            {Object.values(taskBlocksMap).map((taskData) => (
                                                <div key={taskData.taskId} className="study-blocks-task">
                                                    <div className="study-blocks-task-header">
                                                        <span className="task-title">{taskData.taskTitle}</span>
                                                        <span className="block-count">
                                                            {taskData.blocks.length} block{taskData.blocks.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>

                                                    <div className="study-blocks-details">
                                                        {taskData.blocks.map((block, index) => {
                                                            const blockId = `${taskData.taskId}-${new Date(block.start_time).getTime()}`;
                                                            return (
                                                                <div key={index} className="study-block-item">
                                                                    <label className="checkbox-container block-checkbox">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedBlocks[blockId] || false}
                                                                            onChange={() => {
                                                                                setSelectedBlocks(prev => ({
                                                                                    ...prev,
                                                                                    [blockId]: !prev[blockId]
                                                                                }));

                                                                                const updatedBlocks = studyBlocks.map(studyBlock => {
                                                                                    const studyBlockId = `${studyBlock.extendedProps.taskId}-${new Date(studyBlock.start).getTime()}`;
                                                                                    if (studyBlockId === blockId) {
                                                                                        return {
                                                                                            ...studyBlock,
                                                                                            display: !selectedBlocks[blockId] ? 'block' : 'none'
                                                                                        };
                                                                                    }
                                                                                    return studyBlock;
                                                                                });
                                                                                setStudyBlocks(updatedBlocks);
                                                                            }}
                                                                        />
                                                                        <span className="checkmark"></span>
                                                                        <div className="study-block-info">
                                                                            <div className="study-block-time">
                                                                                {new Date(block.start_time).toLocaleDateString('en-US', {
                                                                                    weekday: 'short',
                                                                                    month: 'short',
                                                                                    day: 'numeric'
                                                                                })}
                                                                                {' '}
                                                                                {block.startTimeFormatted} - {block.endTimeFormatted}
                                                                            </div>
                                                                        </div>
                                                                        <div className="study-block-duration">
                                                                            {block.duration} min
                                                                        </div>
                                                                    </label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>No study blocks were generated. Try adjusting your task deadlines or study preferences.</p>
                                    )}
                                </div>
                                <div className="study-blocks-modal-footer">
                                    <button
                                        className="secondary-button"
                                        onClick={() => {
                                            setShowStudyBlocksModal(false);
                                            setStudyBlocks([]);
                                            setHasUnsavedBlocks(false);
                                        }}
                                    >
                                        Discard All
                                    </button>
                                    <button
                                        className="primary-button"
                                        onClick={async () => {
                                            try {
                                                const selectedBlockIds = Object.entries(selectedBlocks)
                                                    .filter(([_, isSelected]) => isSelected)
                                                    .map(([blockId, _]) => blockId);

                                                if (selectedBlockIds.length === 0) {
                                                    setShowStudyBlocksModal(false);
                                                    setStudyBlocks([]);
                                                    setHasUnsavedBlocks(false);
                                                    return;
                                                }

                                                const response = await axios.post(
                                                    `${import.meta.env.VITE_SERVER_URL}/task/schedule`,
                                                    {
                                                        schedulingPeriodDays: 14,
                                                        saveToCalendar: true,
                                                        blockIds: selectedBlockIds
                                                    },
                                                    { withCredentials: true }
                                                );

                                                if (response.status === 200 && response.data.success) {
                                                    await fetchCalendarEvents();

                                                    setStudyBlocks([]);
                                                    setHasUnsavedBlocks(false);
                                                    setShowStudyBlocksModal(false);
                                                    setTaskBlocksMap({});
                                                    setSelectedBlocks({});
                                                }
                                            } catch (err) {
                                                console.error('Error saving study blocks:', err);
                                                alert('Failed to save study blocks. Please try again.');
                                            }
                                        }}
                                    >
                                        Confirm Selected
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export const usePromptIfUnsaved = (hasUnsavedChanges) => {
    useEffect(() => {
        const handleBeforeNavigate = (e) => {
            if (hasUnsavedChanges && !window.confirm('You have unsaved study blocks. If you leave now, they will be discarded. Are you sure you want to leave?')) {
                e.preventDefault();
            }
        };

        window.addEventListener('beforeunload', handleBeforeNavigate);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeNavigate);
        };
    }, [hasUnsavedChanges]);
};

export default CalendarPage;
