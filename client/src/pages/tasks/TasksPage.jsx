import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TasksPage.css";
import Sidebar from "../../components/dashboard_components/Sidebar";

const TasksPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [courses, setCourses] = useState([]);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({
        courseId: "",
        title: "",
        type: "ASSIGNMENT",
        description: "",
        priority: 1,
        deadline: new Date().toISOString().split('T')[0]
    });
    const [editingTask, setEditingTask] = useState(null);
    const [showEditTaskModal, setShowEditTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);

    // Sorting and filtering state

    const [sortOption, setSortOption] = useState("deadline-asc");
    const [filterOptions, setFilterOptions] = useState({
        course: "",
        type: "",
        status: "",
        priority: ""
    });
    const [showFilters, setShowFilters] = useState(false);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/tasks`, {
                withCredentials: true
            });
            setTasks(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching tasks:", err);
            setError("Failed to load tasks. Please try again later.");
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/canvas/courses`, {
                withCredentials: true
            });
            setCourses(response.data);
        } catch (err) {
            console.error("Error fetching courses:", err);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchCourses();
    }, []);

    const handleLogout = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                navigate('/login');
            } else {
                throw new Error('Failed to log out');
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const handleProfileClick = () => {
        setShowProfileDropdown(!showProfileDropdown);
    };

    const handleViewProfile = () => {
        setShowProfileDropdown(false);
        navigate('/profile');
    };

    const handleSettings = () => {
        console.log('Settings clicked - Coming soon!');
        // Future settings functionality
    };

    const handleAddTask = () => {
        setShowAddTaskModal(true);
    };

    const handleCloseAddTaskModal = () => {
        setShowAddTaskModal(false);
        setNewTask({
            courseId: "",
            title: "",
            type: "ASSIGNMENT",
            description: "",
            priority: 1,
            deadline: new Date().toISOString().split('T')[0]
        });
    };

    const handleNewTaskChange = (e) => {
        const { name, value } = e.target;
        setNewTask(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitNewTask = async (e) => {
        e.preventDefault();
        try {
            const taskData = {
                ...newTask,
                priority: parseFloat(newTask.priority)
            };

            await axios.post(`${import.meta.env.VITE_SERVER_URL}/task/create`, taskData, {
                withCredentials: true
            });
            handleCloseAddTaskModal();
            fetchTasks();
        } catch (err) {
            console.error("Error creating task:", err);
            alert("Failed to create task. Please try again.");
        }
    };

    const handleEditTask = (task) => {
        setEditingTask({
            ...task,
            deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ""
        });
        setShowEditTaskModal(true);
    };

    const handleCloseEditTaskModal = () => {
        setShowEditTaskModal(false);
        setEditingTask(null);
    };

    const handleViewTaskDetails = (task) => {
        setSelectedTask(task);
        setShowTaskDetailModal(true);
    };

    const handleCloseTaskDetailModal = () => {
        setShowTaskDetailModal(false);
        setSelectedTask(null);
    };

    const handleEditTaskChange = (e) => {
        const { name, value } = e.target;
        setEditingTask(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitEditTask = async (e) => {
        e.preventDefault();
        try {
            const taskData = {
                ...editingTask,
                priority: parseFloat(editingTask.priority)
            };

            await axios.put(`${import.meta.env.VITE_SERVER_URL}/task/${editingTask.id}`, taskData, {
                withCredentials: true
            });
            handleCloseEditTaskModal();
            fetchTasks();
        } catch (err) {
            console.error("Error updating task:", err);
            alert("Failed to update task. Please try again.");
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            try {
                await axios.delete(`${import.meta.env.VITE_SERVER_URL}/task/${taskId}`, {
                    withCredentials: true
                });
                fetchTasks();
            } catch (err) {
                console.error("Error deleting task:", err);
                alert("Failed to delete task. Please try again.");
            }
        }
    };

    const handleToggleComplete = async (task) => {
        try {
            await axios.put(`${import.meta.env.VITE_SERVER_URL}/task/${task.id}`, {
                ...task,
                priority: parseFloat(task.priority),
                completed: !task.completed
            }, {
                withCredentials: true
            });
            fetchTasks();
        } catch (err) {
            console.error("Error updating task completion status:", err);
            alert("Failed to update task. Please try again.");
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProfileDropdown && !event.target.closest('.header-icons')) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileDropdown]);

    const getTaskTypeLabel = (type) => {
        const typeMap = {
            ASSIGNMENT: "Assignment",
            QUIZ: "Quiz",
            EXAM: "Exam",
            MEETING: "Meeting",
            STUDY_SESSION: "Study Session",
            DISCUSSION: "Discussion"
        };
        return typeMap[type] || type;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "No deadline";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getCourseNameById = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        return course ? course.course_name : "Unknown Course";
    };

    const getPriorityLabel = (priority) => {
        if (priority >= 8) return "High";
        if (priority >= 4) return "Medium";
        return "Low";
    };

    const getPriorityClass = (priority) => {
        if (priority >= 8) return "priority-high";
        if (priority >= 4) return "priority-medium";
        return "priority-low";
    };
    const stripHtmlTags = (html) => {
        if (!html) return "";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || "";
    };

    const getSortedAndFilteredTasks = () => {
        let filteredTasks = [...tasks];

        if (filterOptions.course) {
            filteredTasks = filteredTasks.filter(task => task.courseId === filterOptions.course);
        }

        if (filterOptions.type) {
            filteredTasks = filteredTasks.filter(task => task.type === filterOptions.type);
        }

        if (filterOptions.status) {
            filteredTasks = filteredTasks.filter(task =>
                filterOptions.status === "completed" ? task.completed : !task.completed
            );
        }

        if (filterOptions.priority) {
            filteredTasks = filteredTasks.filter(task => {
                const priorityValue = parseFloat(task.priority);
                if (filterOptions.priority === "high") return priorityValue >= 8;
                if (filterOptions.priority === "medium") return priorityValue >= 4 && priorityValue < 8;
                if (filterOptions.priority === "low") return priorityValue < 4;
                return true;
            });
        }

        filteredTasks.sort((a, b) => {
            switch (sortOption) {
                case "deadline-asc":
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline) - new Date(b.deadline);

                case "deadline-desc":
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(b.deadline) - new Date(a.deadline);

                case "priority-desc":
                    return parseFloat(b.priority) - parseFloat(a.priority);

                case "priority-asc":
                    return parseFloat(a.priority) - parseFloat(b.priority);

                case "title-asc":
                    return a.title.localeCompare(b.title);

                case "title-desc":
                    return b.title.localeCompare(a.title);

                default:
                    return 0;
            }
        });

        return filteredTasks;
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <Sidebar />
                <div className="dashboard-main">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading tasks...</p>
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
                        <button onClick={fetchTasks}>Try Again</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="dashboard-main">
                <div className="dashboard-welcome">
                    <div className="welcome-content">
                        <h1>Tasks</h1>
                        <p>Manage your assignments, quizzes, and other tasks.</p>
                    </div>
                    <div className="header-icon-container">
                        <div className="header-icons">
                            <button className="header-icon settings-icon" onClick={handleSettings}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient id="settings-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#7735e2" />
                                            <stop offset="100%" stopColor="#0a63ac" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="url(#settings-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2569 9.77251 19.9859C9.5799 19.7148 9.31074 19.5063 9 19.38C8.69838 19.2469 8.36381 19.2072 8.03941 19.266C7.71502 19.3248 7.41568 19.4795 7.18 19.71L7.12 19.77C6.93425 19.956 6.71368 20.1035 6.47088 20.2041C6.22808 20.3048 5.96783 20.3566 5.705 20.3566C5.44217 20.3566 5.18192 20.3048 4.93912 20.2041C4.69632 20.1035 4.47575 19.956 4.29 19.77C4.10405 19.5843 3.95653 19.3637 3.85588 19.1209C3.75523 18.8781 3.70343 18.6178 3.70343 18.355C3.70343 18.0922 3.75523 17.8319 3.85588 17.5891C3.95653 17.3463 4.10405 17.1257 4.29 16.94L4.35 16.88C4.58054 16.6443 4.73519 16.345 4.794 16.0206C4.85282 15.6962 4.81312 15.3616 4.68 15.06C4.55324 14.7642 4.34276 14.512 4.07447 14.3343C3.80618 14.1566 3.49179 14.0613 3.17 14.06H3C2.46957 14.06 1.96086 13.8493 1.58579 13.4742C1.21071 13.0991 1 12.5904 1 12.06C1 11.5296 1.21071 11.0209 1.58579 10.6458C1.96086 10.2707 2.46957 10.06 3 10.06H3.09C3.42099 10.0523 3.742 9.94512 4.01309 9.75251C4.28417 9.5599 4.49268 9.29074 4.62 8.98C4.75312 8.67838 4.79282 8.34381 4.734 8.01941C4.67519 7.69502 4.52054 7.39568 4.29 7.16L4.23 7.1C4.04405 6.91425 3.89653 6.69368 3.79588 6.45088C3.69523 6.20808 3.64343 5.94783 3.64343 5.685C3.64343 5.42217 3.69523 5.16192 3.79588 4.91912C3.89653 4.67632 4.04405 4.45575 4.23 4.27C4.41575 4.08405 4.63632 3.93653 4.87912 3.83588C5.12192 3.73523 5.38217 3.68343 5.645 3.68343C5.90783 3.68343 6.16808 3.73523 6.41088 3.83588C6.65368 3.93653 6.87425 4.08405 7.06 4.27L7.12 4.33C7.35568 4.56054 7.65502 4.71519 7.97941 4.774C8.30381 4.83282 8.63838 4.79312 8.94 4.66H9C9.29577 4.53324 9.54802 4.32276 9.72569 4.05447C9.90337 3.78618 9.99872 3.47179 10 3.15V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="url(#settings-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                            <div className="profile-container">
                                <button className="header-icon profile-icon" onClick={handleProfileClick}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="profile-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#7735e2" />
                                                <stop offset="100%" stopColor="#0a63ac" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="url(#profile-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="12" cy="7" r="4" stroke="url(#profile-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                                {showProfileDropdown && (
                                    <div className="profile-dropdown">
                                        <button className="dropdown-item" onClick={handleViewProfile}>
                                            View Profile
                                        </button>
                                        <button className="dropdown-item logout-item" onClick={handleLogout}>
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="tasks-container">
                    <div className="tasks-header">
                        <div className="tasks-controls">
                            <div className="filter-sort-container">
                                <div className="sort-container">
                                    <select
                                        className="sort-select"
                                        value={sortOption}
                                        onChange={(e) => setSortOption(e.target.value)}
                                    >
                                        <option value="deadline-asc">Deadline (Earliest First)</option>
                                        <option value="deadline-desc">Deadline (Latest First)</option>
                                        <option value="priority-desc">Priority (Highest First)</option>
                                        <option value="priority-asc">Priority (Lowest First)</option>
                                        <option value="title-asc">Title (A-Z)</option>
                                        <option value="title-desc">Title (Z-A)</option>
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
                            <button className="add-task-button" onClick={handleAddTask}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Add Task
                            </button>
                        </div>

                        {showFilters && (
                            <div className="filters-panel">
                                <div className="filter-group">
                                    <label>Course</label>
                                    <select
                                        value={filterOptions.course}
                                        onChange={(e) => setFilterOptions({...filterOptions, course: e.target.value})}
                                    >
                                        <option value="">All Courses</option>
                                        {courses.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.course_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label>Type</label>
                                    <select
                                        value={filterOptions.type}
                                        onChange={(e) => setFilterOptions({...filterOptions, type: e.target.value})}
                                    >
                                        <option value="">All Types</option>
                                        <option value="ASSIGNMENT">Assignment</option>
                                        <option value="QUIZ">Quiz</option>
                                        <option value="EXAM">Exam</option>
                                        <option value="MEETING">Meeting</option>
                                        <option value="STUDY_SESSION">Study Session</option>
                                        <option value="DISCUSSION">Discussion</option>
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label>Status</label>
                                    <select
                                        value={filterOptions.status}
                                        onChange={(e) => setFilterOptions({...filterOptions, status: e.target.value})}
                                    >
                                        <option value="">All Status</option>
                                        <option value="completed">Completed</option>
                                        <option value="incomplete">Incomplete</option>
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label>Priority</label>
                                    <select
                                        value={filterOptions.priority}
                                        onChange={(e) => setFilterOptions({...filterOptions, priority: e.target.value})}
                                    >
                                        <option value="">All Priorities</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                                <button
                                    className="clear-filters-button"
                                    onClick={() => setFilterOptions({
                                        course: "",
                                        type: "",
                                        status: "",
                                        priority: ""
                                    })}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="tasks-list">
                        {tasks.length === 0 ? (
                            <div className="no-tasks">
                                <p>You don't have any tasks yet. Click "Add Task" to create one.</p>
                            </div>
                        ) : (
                            getSortedAndFilteredTasks().length === 0 ? (
                                <div className="no-tasks">
                                    <p>No tasks match your current filters. Try adjusting your filter criteria.</p>
                                </div>
                            ) : (
                                getSortedAndFilteredTasks().map(task => (
                                <div
                                    key={task.id}
                                    className={`task-card ${task.completed ? 'completed' : ''}`}
                                    onClick={() => handleViewTaskDetails(task)}
                                >
                                    <div className="task-header">
                                        <div className="task-title-container">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleComplete(task);
                                                }}
                                                className="task-checkbox"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <h3 className="task-title">{task.title}</h3>
                                        </div>
                                        <div className="task-actions">
                                            <button
                                                className="task-action-button edit"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditTask(task);
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                            <button
                                                className="task-action-button delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTask(task.id);
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="task-details">
                                        <div className="task-detail">
                                            <span className="detail-label">Course:</span>
                                            <span className="detail-value">{getCourseNameById(task.courseId)}</span>
                                        </div>
                                        <div className="task-detail">
                                            <span className="detail-label">Type:</span>
                                            <span className="detail-value">{getTaskTypeLabel(task.type)}</span>
                                        </div>
                                        <div className="task-detail">
                                            <span className="detail-label">Deadline:</span>
                                            <span className="detail-value">{formatDate(task.deadline)}</span>
                                        </div>
                                        <div className="task-detail">
                                            <span className="detail-label">Priority:</span>
                                            <span className={`detail-value priority ${getPriorityClass(task.priority)}`}>
                                                {getPriorityLabel(task.priority)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                ))
                            )
                        )}
                    </div>
                </div>

                {showAddTaskModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Add New Task</h2>
                                <button className="close-button" onClick={handleCloseAddTaskModal}>×</button>
                            </div>
                            <form onSubmit={handleSubmitNewTask}>
                                <div className="form-group">
                                    <label htmlFor="title">Title</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={newTask.title}
                                        onChange={handleNewTaskChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="courseId">Course</label>
                                    <select
                                        id="courseId"
                                        name="courseId"
                                        value={newTask.courseId}
                                        onChange={handleNewTaskChange}
                                        required
                                    >
                                        <option value="">Select a course</option>
                                        {courses.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.course_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="type">Type</label>
                                    <select
                                        id="type"
                                        name="type"
                                        value={newTask.type}
                                        onChange={handleNewTaskChange}
                                    >
                                        <option value="ASSIGNMENT">Assignment</option>
                                        <option value="QUIZ">Quiz</option>
                                        <option value="EXAM">Exam</option>
                                        <option value="MEETING">Meeting</option>
                                        <option value="STUDY_SESSION">Study Session</option>
                                        <option value="DISCUSSION">Discussion</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="deadline">Deadline</label>
                                    <input
                                        type="date"
                                        id="deadline"
                                        name="deadline"
                                        value={newTask.deadline}
                                        onChange={handleNewTaskChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="priority">Priority (1-10)</label>
                                    <input
                                        type="number"
                                        id="priority"
                                        name="priority"
                                        min="1"
                                        max="10"
                                        value={newTask.priority}
                                        onChange={handleNewTaskChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={newTask.description}
                                        onChange={handleNewTaskChange}
                                        rows="3"
                                    ></textarea>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="cancel-button" onClick={handleCloseAddTaskModal}>Cancel</button>
                                    <button type="submit" className="submit-button">Add Task</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showTaskDetailModal && selectedTask && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Task Details</h2>
                                <button className="close-button" onClick={handleCloseTaskDetailModal}>×</button>
                            </div>
                            <div className="task-detail-content">
                                <div className="task-detail-header">
                                    <div className="task-detail-title-container">
                                        <h3 className="task-detail-title">{selectedTask.title}</h3>
                                        <span className={`task-detail-status ${selectedTask.completed ? 'completed' : 'in-progress'}`}>
                                            {selectedTask.completed ? 'Completed' : 'In Progress'}
                                        </span>
                                    </div>
                                </div>

                                <div className="task-detail-info">
                                    <div className="task-detail-row">
                                        <div className="task-detail-label">Course</div>
                                        <div className="task-detail-value">{getCourseNameById(selectedTask.courseId)}</div>
                                    </div>
                                    <div className="task-detail-row">
                                        <div className="task-detail-label">Type</div>
                                        <div className="task-detail-value">{getTaskTypeLabel(selectedTask.type)}</div>
                                    </div>
                                    <div className="task-detail-row">
                                        <div className="task-detail-label">Deadline</div>
                                        <div className="task-detail-value">{formatDate(selectedTask.deadline)}</div>
                                    </div>
                                    <div className="task-detail-row">
                                        <div className="task-detail-label">Priority</div>
                                        <div className="task-detail-value">
                                            <span className={`priority-badge ${getPriorityClass(selectedTask.priority)}`}>
                                                {getPriorityLabel(selectedTask.priority)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="task-detail-row">
                                        <div className="task-detail-label">Created</div>
                                        <div className="task-detail-value">{formatDate(selectedTask.createdAt)}</div>
                                    </div>
                                    <div className="task-detail-row">
                                        <div className="task-detail-label">Last Updated</div>
                                        <div className="task-detail-value">{formatDate(selectedTask.updatedAt)}</div>
                                    </div>
                                </div>

                                {selectedTask.description && (
                                    <div className="task-detail-description">
                                        <h4>Description</h4>
                                        <p>{stripHtmlTags(selectedTask.description)}</p>
                                    </div>
                                )}

                                <div className="task-detail-actions">
                                    <button
                                        className="task-detail-action-button edit"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditTask(selectedTask);
                                            handleCloseTaskDetailModal();
                                        }}
                                    >
                                        Edit Task
                                    </button>
                                    <button
                                        className="task-detail-action-button toggle"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleComplete(selectedTask);
                                            handleCloseTaskDetailModal();
                                        }}
                                    >
                                        Mark as {selectedTask.completed ? 'Incomplete' : 'Complete'}
                                    </button>
                                    <button
                                        className="task-detail-action-button delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTask(selectedTask.id);
                                            handleCloseTaskDetailModal();
                                        }}
                                    >
                                        Delete Task
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showEditTaskModal && editingTask && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Edit Task</h2>
                                <button className="close-button" onClick={handleCloseEditTaskModal}>×</button>
                            </div>
                            <form onSubmit={handleSubmitEditTask}>
                                <div className="form-group">
                                    <label htmlFor="edit-title">Title</label>
                                    <input
                                        type="text"
                                        id="edit-title"
                                        name="title"
                                        value={editingTask.title}
                                        onChange={handleEditTaskChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="edit-courseId">Course</label>
                                    <select
                                        id="edit-courseId"
                                        name="courseId"
                                        value={editingTask.courseId}
                                        onChange={handleEditTaskChange}
                                        required
                                    >
                                        <option value="">Select a course</option>
                                        {courses.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.course_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="edit-type">Type</label>
                                    <select
                                        id="edit-type"
                                        name="type"
                                        value={editingTask.type}
                                        onChange={handleEditTaskChange}
                                    >
                                        <option value="ASSIGNMENT">Assignment</option>
                                        <option value="QUIZ">Quiz</option>
                                        <option value="EXAM">Exam</option>
                                        <option value="MEETING">Meeting</option>
                                        <option value="STUDY_SESSION">Study Session</option>
                                        <option value="DISCUSSION">Discussion</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="edit-deadline">Deadline</label>
                                    <input
                                        type="date"
                                        id="edit-deadline"
                                        name="deadline"
                                        value={editingTask.deadline}
                                        onChange={handleEditTaskChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="edit-priority">Priority (1-10)</label>
                                    <input
                                        type="number"
                                        id="edit-priority"
                                        name="priority"
                                        min="1"
                                        max="10"
                                        value={editingTask.priority}
                                        onChange={handleEditTaskChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="edit-description">Description</label>
                                    <textarea
                                        id="edit-description"
                                        name="description"
                                        value={editingTask.description}
                                        onChange={handleEditTaskChange}
                                        rows="3"
                                    ></textarea>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="edit-completed">Status</label>
                                    <select
                                        id="edit-completed"
                                        name="completed"
                                        value={editingTask.completed.toString()}
                                        onChange={(e) => {
                                            setEditingTask(prev => ({
                                                ...prev,
                                                completed: e.target.value === "true"
                                            }));
                                        }}
                                    >
                                        <option value="false">In Progress</option>
                                        <option value="true">Completed</option>
                                    </select>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="cancel-button" onClick={handleCloseEditTaskModal}>Cancel</button>
                                    <button type="submit" className="submit-button">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TasksPage;
