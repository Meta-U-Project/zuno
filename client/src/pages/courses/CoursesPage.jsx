import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CoursesPage.css";
import Sidebar from "../../components/dashboard_components/Sidebar";
import WelcomeHeader from "../../components/dashboard_components/WelcomeHeader";

const CoursesPage = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState("name-asc");
    const [filterOptions, setFilterOptions] = useState({
        term: "",
        instructor: ""
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showCourseDetailModal, setShowCourseDetailModal] = useState(false);
    const [courseTasks, setCourseTasks] = useState([]);
    const [courseTasksLoading, setCourseTasksLoading] = useState(false);
    const [studyBlocks, setStudyBlocks] = useState([]);
    const [studyBlocksLoading, setStudyBlocksLoading] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("tasks");

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/canvas/courses`, {
                withCredentials: true
            });
            setCourses(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching courses:", err);
            setError("Failed to load courses. Please try again later.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleSettings = () => {
        // Future settings functionality
    };

    const handleViewCourseDetails = async (course) => {
        setSelectedCourse(course);
        setShowCourseDetailModal(true);

        try {
            setCourseTasksLoading(true);
            const tasksResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/canvas/assignments`, {
                withCredentials: true
            });

            if (tasksResponse.status === 200) {
                const courseTasks = tasksResponse.data.assignments.filter(task => task.courseId === course.id);
                setCourseTasks(courseTasks);
            }
        } catch (err) {
            console.error("Error fetching course tasks:", err);
        } finally {
            setCourseTasksLoading(false);
        }

        try {
            setStudyBlocksLoading(true);
            const eventsResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/canvas/calendarevents`, {
                withCredentials: true
            });

            if (eventsResponse.status === 200) {
                const courseStudyBlocks = eventsResponse.data
                    .filter(event =>
                        event.type === 'task_block' &&
                        event.courseId === course.id &&
                        new Date(event.date) > new Date()
                    )
                    .sort((a, b) => new Date(a.date) - new Date(b.date));

                setStudyBlocks(courseStudyBlocks);
            }
        } catch (err) {
            console.error("Error fetching study blocks:", err);
        } finally {
            setStudyBlocksLoading(false);
        }

        try {
            setAnnouncementsLoading(true);
            const announcementsResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/canvas/announcements`, {
                withCredentials: true
            });

            if (announcementsResponse.status === 200) {
                const courseAnnouncements = announcementsResponse.data
                    .filter(announcement => announcement.courseId === course.id)
                    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt)); // Sort newest first

                setAnnouncements(courseAnnouncements);
            }
        } catch (err) {
            console.error("Error fetching announcements:", err);
        } finally {
            setAnnouncementsLoading(false);
        }
    };

    const handleCloseCourseDetailModal = () => {
        setShowCourseDetailModal(false);
        setSelectedCourse(null);
        setCourseTasks([]);
    };

    const getUniqueTerms = () => {
        const terms = [...new Set(courses.map(course => course.term))];
        return terms.sort();
    };

    const getUniqueInstructors = () => {
        const instructors = [...new Set(courses.map(course => course.instructor_name))];
        return instructors.sort();
    };

    const getSortedAndFilteredCourses = () => {
        let filteredCourses = [...courses];

        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase().trim();
            filteredCourses = filteredCourses.filter(course =>
                course.course_name.toLowerCase().includes(query) ||
                course.course_code.toLowerCase().includes(query) ||
                course.instructor_name.toLowerCase().includes(query)
            );
        }

        if (filterOptions.term) {
            filteredCourses = filteredCourses.filter(course => course.term === filterOptions.term);
        }

        if (filterOptions.instructor) {
            filteredCourses = filteredCourses.filter(course => course.instructor_name === filterOptions.instructor);
        }

        filteredCourses.sort((a, b) => {
            switch (sortOption) {
                case "name-asc":
                    return a.course_name.localeCompare(b.course_name);
                case "name-desc":
                    return b.course_name.localeCompare(a.course_name);
                case "code-asc":
                    return a.course_code.localeCompare(b.course_code);
                case "code-desc":
                    return b.course_code.localeCompare(a.course_code);
                case "instructor-asc":
                    return a.instructor_name.localeCompare(b.instructor_name);
                case "instructor-desc":
                    return b.instructor_name.localeCompare(a.instructor_name);
                case "grade-asc":
                    if (a.current_score === null && b.current_score === null) return 0;
                    if (a.current_score === null) return 1;
                    if (b.current_score === null) return -1;
                    return a.current_score - b.current_score;
                case "grade-desc":
                    if (a.current_score === null && b.current_score === null) return 0;
                    if (a.current_score === null) return 1;
                    if (b.current_score === null) return -1;
                    return b.current_score - a.current_score;
                default:
                    return 0;
            }
        });

        return filteredCourses;
    };

    const getTasksStats = (tasks) => {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const upcoming = tasks.filter(task => !task.completed && new Date(task.deadline) > new Date()).length;
        const overdue = tasks.filter(task => !task.completed && new Date(task.deadline) < new Date()).length;

        return { total, completed, upcoming, overdue };
    };

    const formatDate = (dateString) => {
        if (!dateString) return "No date";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <Sidebar />
                <div className="dashboard-main">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading courses...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <Sidebar />
                <div className="dashboard-main">
                    <div className="error-container">
                        <p>{error}</p>
                        <button onClick={fetchCourses}>Try Again</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="dashboard-main">
                <WelcomeHeader
                    title="Courses"
                    subtitle="Manage your courses and access course materials."
                    onSettingsClick={handleSettings}
                />

                <div className="courses-container">
                    <div className="courses-header">
                        <div className="courses-controls">
                            <div className="search-container">
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                            <div className="filter-sort-container">
                                <div className="view-toggle">
                                    <button
                                        className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
                                        onClick={() => setViewMode('grid')}
                                        title="Grid View"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                    <button
                                        className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                                        onClick={() => setViewMode('list')}
                                        title="List View"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                </div>
                                <div className="sort-container">
                                    <select
                                        className="sort-select"
                                        value={sortOption}
                                        onChange={(e) => setSortOption(e.target.value)}
                                    >
                                        <option value="name-asc">Course Name (A-Z)</option>
                                        <option value="name-desc">Course Name (Z-A)</option>
                                        <option value="code-asc">Course Code (A-Z)</option>
                                        <option value="code-desc">Course Code (Z-A)</option>
                                        <option value="instructor-asc">Instructor (A-Z)</option>
                                        <option value="instructor-desc">Instructor (Z-A)</option>
                                        <option value="grade-asc">Grade (Low to High)</option>
                                        <option value="grade-desc">Grade (High to Low)</option>
                                    </select>
                                </div>
                                <button
                                    className="filter-button"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Filter
                                </button>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="filters-panel">
                                <div className="filter-group">
                                    <label>Term</label>
                                    <select
                                        value={filterOptions.term}
                                        onChange={(e) => setFilterOptions({...filterOptions, term: e.target.value})}
                                    >
                                        <option value="">All Terms</option>
                                        {getUniqueTerms().map((term, index) => (
                                            <option key={index} value={term}>{term}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label>Instructor</label>
                                    <select
                                        value={filterOptions.instructor}
                                        onChange={(e) => setFilterOptions({...filterOptions, instructor: e.target.value})}
                                    >
                                        <option value="">All Instructors</option>
                                        {getUniqueInstructors().map((instructor, index) => (
                                            <option key={index} value={instructor}>{instructor}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    className="clear-filters-button"
                                    onClick={() => setFilterOptions({
                                        term: "",
                                        instructor: ""
                                    })}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={`courses-list ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
                        {courses.length === 0 ? (
                            <div className="no-courses">
                                <p>You don't have any courses yet. Connect your Canvas account to import your courses.</p>
                            </div>
                        ) : (
                            getSortedAndFilteredCourses().length === 0 ? (
                                <div className="no-courses">
                                    <p>No courses match your current filters. Try adjusting your filter criteria.</p>
                                </div>
                            ) : (
                                getSortedAndFilteredCourses().map(course => (
                                    <div
                                        key={course.id}
                                        className="course-card"
                                        onClick={() => handleViewCourseDetails(course)}
                                    >
                                        <div className="course-header">
                                            <h3 className="course-name">{course.course_name}</h3>
                                            <span className="course-code">{course.course_code}</span>
                                        </div>
                                        <div className="course-details">
                                            <div className="course-detail">
                                                <span className="detail-label">Instructor:</span>
                                                <span className="detail-value">{course.instructor_name}</span>
                                            </div>
                                            <div className="course-detail">
                                                <span className="detail-label">Term:</span>
                                                <span className="detail-value">{course.term}</span>
                                            </div>
                                            {course.current_grade && (
                                                <div className="course-detail">
                                                    <span className="detail-label">Grade:</span>
                                                    <span className="detail-value grade">{course.current_grade}</span>
                                                </div>
                                            )}
                                            {course.current_score !== null && (
                                                <div className="course-detail">
                                                    <span className="detail-label">Score:</span>
                                                    <span className="detail-value">{course.current_score}%</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="course-footer">
                                            <button className="view-course-button">
                                                View Details
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>

                {showCourseDetailModal && selectedCourse && (
                    <div className="modal-overlay">
                        <div className="modal-content course-detail-modal">
                            <div className="modal-header">
                                <h2>{selectedCourse.course_name}</h2>
                                <button className="close-button" onClick={handleCloseCourseDetailModal}>×</button>
                            </div>
                            <div className="course-detail-content">
                                <div className="course-info-section">
                                    <div className="course-info-grid">
                                        <div className="course-info-item">
                                            <span className="info-label">Course Code</span>
                                            <span className="info-value">{selectedCourse.course_code}</span>
                                        </div>
                                        <div className="course-info-item">
                                            <span className="info-label">Instructor</span>
                                            <span className="info-value">{selectedCourse.instructor_name}</span>
                                        </div>
                                        <div className="course-info-item">
                                            <span className="info-label">Term</span>
                                            <span className="info-value">{selectedCourse.term}</span>
                                        </div>
                                        <div className="course-info-item">
                                            <span className="info-label">Created</span>
                                            <span className="info-value">{formatDate(selectedCourse.createdAt)}</span>
                                        </div>
                                        {selectedCourse.current_grade && (
                                            <div className="course-info-item">
                                                <span className="info-label">Current Grade</span>
                                                <span className="info-value grade-badge">{selectedCourse.current_grade}</span>
                                            </div>
                                        )}
                                        {selectedCourse.current_score !== null && (
                                            <div className="course-info-item">
                                                <span className="info-label">Current Score</span>
                                                <span className="info-value">{selectedCourse.current_score}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="course-tabs">
                                    <button
                                        className={`tab-button ${activeTab === "tasks" ? "active" : ""}`}
                                        onClick={() => setActiveTab("tasks")}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M21 12V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Tasks
                                    </button>
                                    <button
                                        className={`tab-button ${activeTab === "studyBlocks" ? "active" : ""}`}
                                        onClick={() => setActiveTab("studyBlocks")}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        Study Blocks
                                    </button>
                                    <button
                                        className={`tab-button ${activeTab === "announcements" ? "active" : ""}`}
                                        onClick={() => setActiveTab("announcements")}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Announcements
                                    </button>
                                </div>

                                {activeTab === "tasks" && (
                                <div className="course-tab-content">
                                    <h3>Course Tasks</h3>
                                    {courseTasksLoading ? (
                                        <div className="loading-indicator">
                                            <div className="loading-spinner small"></div>
                                            <span>Loading tasks...</span>
                                        </div>
                                    ) : courseTasks.length > 0 ? (
                                        <>
                                            <div className="tasks-stats">
                                                <div className="task-stat">
                                                    <span className="stat-value">{getTasksStats(courseTasks).total}</span>
                                                    <span className="stat-label">Total</span>
                                                </div>
                                                <div className="task-stat">
                                                    <span className="stat-value">{getTasksStats(courseTasks).completed}</span>
                                                    <span className="stat-label">Completed</span>
                                                </div>
                                                <div className="task-stat">
                                                    <span className="stat-value">{getTasksStats(courseTasks).upcoming}</span>
                                                    <span className="stat-label">Upcoming</span>
                                                </div>
                                                <div className="task-stat">
                                                    <span className="stat-value">{getTasksStats(courseTasks).overdue}</span>
                                                    <span className="stat-label">Overdue</span>
                                                </div>
                                            </div>
                                            <div className="course-tasks-list">
                                                {courseTasks.slice(0, 5).map((task, index) => (
                                                    <div key={index} className={`course-task-item ${task.completed ? 'completed' : ''}`}>
                                                        <div className="task-status">
                                                            <span className={`status-indicator ${task.completed ? 'completed' : 'pending'}`}></span>
                                                        </div>
                                                        <div className="task-info">
                                                            <h4>{task.title}</h4>
                                                            <p>{task.type}</p>
                                                        </div>
                                                        <div className="task-deadline">
                                                            {task.deadline ? formatDate(task.deadline) : 'No deadline'}
                                                        </div>
                                                    </div>
                                                ))}
                                                {courseTasks.length > 5 && (
                                                    <div className="view-all-tasks">
                                                        <button className="view-all-button">
                                                            View all {courseTasks.length} tasks
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="no-tasks-message">
                                            <p>No tasks found for this course.</p>
                                        </div>
                                    )}
                                </div>
                                )}

                                {activeTab === "studyBlocks" && (
                                <div className="course-tab-content">
                                    <h3>Upcoming Study Blocks</h3>
                                    {studyBlocksLoading ? (
                                        <div className="loading-indicator">
                                            <div className="loading-spinner small"></div>
                                            <span>Loading study blocks...</span>
                                        </div>
                                    ) : studyBlocks.length > 0 ? (
                                        <div className="course-study-blocks">
                                            {studyBlocks.map((block, index) => (
                                                <div key={index} className="study-block-item">
                                                    <div className="study-block-icon">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <circle cx="12" cy="12" r="10" stroke="#48bb78" strokeWidth="2" />
                                                            <path d="M12 6v6l4 2" stroke="#48bb78" strokeWidth="2" strokeLinecap="round" />
                                                        </svg>
                                                    </div>
                                                    <div className="study-block-info">
                                                        <h4>{block.title}</h4>
                                                        <p>
                                                            {new Date(block.date).toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-tasks-message">
                                            <p>No upcoming study blocks for this course.</p>
                                        </div>
                                    )}
                                </div>
                                )}

                                {activeTab === "announcements" && (
                                <div className="course-tab-content">
                                    <h3>Course Announcements</h3>
                                    {announcementsLoading ? (
                                        <div className="loading-indicator">
                                            <div className="loading-spinner small"></div>
                                            <span>Loading announcements...</span>
                                        </div>
                                    ) : announcements.length > 0 ? (
                                        <div className="course-announcements">
                                            {announcements.map((announcement, index) => (
                                                <div key={index} className="announcement-item">
                                                    <div className="announcement-header">
                                                        <h4>{announcement.title}</h4>
                                                        <span className="announcement-date">
                                                            {new Date(announcement.postedAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className="announcement-content"
                                                        dangerouslySetInnerHTML={{ __html: announcement.message }}
                                                    />
                                                    {announcement.url && (
                                                        <div className="announcement-actions">
                                                            <a
                                                                href={announcement.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="announcement-link"
                                                            >
                                                                View in Canvas
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                    <path d="M15 3h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                    <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                </svg>
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-tasks-message">
                                            <p>No announcements found for this course.</p>
                                        </div>
                                    )}
                                </div>
                                )}

                                <div className="course-actions">
                                    <button className="course-action-button primary">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        View in Calendar
                                    </button>
                                    <button className="course-action-button secondary">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M21 12V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        View Tasks
                                    </button>
                                    {selectedCourse.canvas_url && (
                                        <a
                                            href={selectedCourse.canvas_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="course-action-button secondary"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M15 3h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Open in Canvas
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoursesPage;
