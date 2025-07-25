import { useState, useEffect } from "react";
import "./DashboardLayout.css";
import AnalyticsCard from "./AnalyticsCard";
import NotesCard from "./NotesCard";
import NotificationsSection from "../notifications/NotificationsSection";

const DashboardLayout = () => {
    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredEvent, setHoveredEvent] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                const coursesResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/canvas/courses`, {
                    credentials: 'include',
                });
                if (coursesResponse.ok) {
                    const coursesData = await coursesResponse.json();
                    setCourses(coursesData.slice(0, 3));
                }

                const assignmentsResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/canvas/assignments`, {
                    credentials: 'include',
                });
                if (assignmentsResponse.ok) {
                    const assignmentsData = await assignmentsResponse.json();
                    const upcomingAssignments = assignmentsData.assignments
                        ?.filter(assignment => !assignment.completed && new Date(assignment.deadline) > new Date())
                        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                        .slice(0, 4) || [];
                    setAssignments(upcomingAssignments);
                }

                const today = new Date();
                const startOfWeek = new Date(today);
                const endOfWeek = new Date(today);

                startOfWeek.setDate(today.getDate() - today.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
                endOfWeek.setHours(23, 59, 59, 999);

                let allEvents = [];

                const calendarResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/canvas/calendarevents`, {
                    credentials: 'include',
                });

                if (calendarResponse.ok) {
                    const calendarData = await calendarResponse.json();
                    const weekEvents = calendarData.filter(event => {
                        const eventDate = new Date(event.date);
                        return eventDate >= startOfWeek && eventDate <= endOfWeek;
                    }).map(event => ({
                        ...event,
                        type: event.type || 'assignment'
                    }));

                    allEvents = [...weekEvents];
                }

                const classSessionsResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/canvas/classsessions`, {
                    credentials: 'include',
                });

                if (classSessionsResponse.ok) {
                    const classSessionsData = await classSessionsResponse.json();
                    const weekSessions = classSessionsData.filter(session => {
                        const sessionDate = new Date(session.start_time);
                        return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
                    }).map(session => ({
                        id: session.id,
                        title: session.title,
                        date: session.start_time,
                        type: 'class_session',
                        courseId: session.courseId,
                        courseName: session.courseName,
                        bg: '#4299e1'
                    }));

                    allEvents = [...allEvents, ...weekSessions];
                }

                allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
                setCalendarEvents(allEvents);

                const announcementsResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/canvas/announcements`, {
                    credentials: 'include',
                });
                if (announcementsResponse.ok) {
                    const announcementsData = await announcementsResponse.json();
                    setAnnouncements(announcementsData.slice(0, 3));
                }

            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDaysUntilDeadline = (deadline) => {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        if (diffDays > 0) return `Due in ${diffDays} days`;
        return 'Overdue';
    };

    if (loading) {
        return (
            <div className="dashboard-content">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-content-grid">
            <div className="grid-analytics">
                <AnalyticsCard />
            </div>

            <div className="dashboard-card calendar-card grid-calendar">
                <div className="card-header">
                    <h3>This Week's Calendar</h3>
                    <a href="/calendar" className="view-all-link">view all</a>
                </div>
                <div className="card-content">
                    <div className="calendar-grid">
                        <div className="calendar-header">
                            <div className="day-header">Sun</div>
                            <div className="day-header">Mon</div>
                            <div className="day-header">Tue</div>
                            <div className="day-header">Wed</div>
                            <div className="day-header">Thu</div>
                            <div className="day-header">Fri</div>
                            <div className="day-header">Sat</div>
                        </div>
                        <div className="calendar-days">
                            {(() => {
                                const today = new Date();
                                const startOfWeek = new Date(today);
                                startOfWeek.setDate(today.getDate() - today.getDay());

                                const days = [];
                                for (let i = 0; i < 7; i++) {
                                    const currentDay = new Date(startOfWeek);
                                    currentDay.setDate(startOfWeek.getDate() + i);

                                    const dayEvents = calendarEvents.filter(event => {
                                        const eventDate = new Date(event.date);
                                        return eventDate.toDateString() === currentDay.toDateString();
                                    });

                                    const isToday = currentDay.toDateString() === today.toDateString();

                                    days.push(
                                        <div key={i} className={`calendar-day ${isToday ? 'today' : ''}`}>
                                            <div className="day-number">{currentDay.getDate()}</div>
                                            <div className="day-events">
                                                {dayEvents.slice(0, 3).map((event, eventIndex) => {
                                                    const eventColor = event.bg || (
                                                        event.type === 'class_session' ? '#4299e1' :
                                                        event.type === 'task_block' ? '#48bb78' :
                                                        '#7735e2'
                                                    );

                                                    return (
                                                        <div
                                                            key={eventIndex}
                                                            className="day-event"
                                                            data-type={event.type || 'assignment'}
                                                            onMouseEnter={(e) => {
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                setTooltipPosition({ x: rect.left, y: rect.top - 80 });
                                                                setHoveredEvent(event);
                                                            }}

                                                            onMouseLeave={() => {
                                                                setHoveredEvent(null);
                                                            }}
                                                        >
                                                            <div
                                                                className="event-dot"
                                                                style={{ background: eventColor }}
                                                            ></div>
                                                        </div>
                                                    );
                                                })}
                                                {dayEvents.length > 3 && (
                                                    <div className="more-events">+{dayEvents.length - 3} more</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return days;
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-card courses-card grid-courses">
                <div className="card-header">
                    <h3>Your Courses</h3>
                    <a href="/courses" className="view-all-link">view all</a>
                </div>
                <div className={`card-content ${courses.length > 2 ? 'courses-grid' : ''}`}>
                    {courses.length > 0 ? (
                        courses.slice(0, 4).map((course, index) => (
                            <div key={index} className="course-item">
                                <div className="course-info">
                                    <h4>{course.course_name}</h4>
                                    <p>{course.course_code}</p>
                                </div>
                                <div className="course-instructor">
                                    {course.instructor_name}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>No courses found. Connect your Canvas account to see your courses.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="dashboard-card notifications-card grid-notifs">
                <div className="card-header">
                    <h3>Recent Notifications</h3>
                    <a href="/notifications" className="view-all-link">view all</a>
                </div>
                <div className="card-content">
                    <NotificationsSection />
                </div>
            </div>

            <div className="grid-notes">
                <NotesCard />
            </div>

            <div className="dashboard-card tasks-card grid-tasks">
                <div className="card-header">
                    <h3>Upcoming Tasks</h3>
                    <a href="/tasks" className="view-all-link">view all</a>
                </div>
                <div className="card-content tasks-content">
                    {assignments.length > 0 ? (
                        assignments.slice(0, 2).map((assignment, index) => (
                            <div key={index} className="task-item">
                                <div className="task-info">
                                    <h4>{assignment.title}</h4>
                                    <p>{assignment.course?.course_name}</p>
                                </div>
                                <div className="task-deadline">
                                    <span className={`deadline-badge ${getDaysUntilDeadline(assignment.deadline).includes('Overdue') ? 'overdue' : ''}`}>
                                        {getDaysUntilDeadline(assignment.deadline)}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>No upcoming assignments</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="dashboard-card study-card grid-study">
                <div className="card-header">
                    <h3>Study Material</h3>
                    <a href="#" className="view-all-link">view all</a>
                </div>
                <div className="card-content">
                    <div className="study-options">
                        <div className="study-option">
                            <div className="study-info">
                                <h4>Course Materials</h4>
                                <p>Access your course files and resources</p>
                            </div>
                        </div>
                        <div className="study-option">
                            <div className="study-info">
                                <h4>Study Notes</h4>
                                <p>Create and organize your study notes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="chat-widget">
                <button className="chat-button">Chat with Zuno</button>
            </div>
            {hoveredEvent && (
                <div
                    className="event-tooltip"
                    style={{
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y}px`,
                        opacity: 1,
                        visibility: 'visible',
                    }}
                >
                    <div className="tooltip-title">{hoveredEvent.title}</div>
                    <div className="tooltip-course">{hoveredEvent.courseName}</div>
                    {hoveredEvent.type === 'class_session' && (
                        <div className="tooltip-type">Class Session</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
