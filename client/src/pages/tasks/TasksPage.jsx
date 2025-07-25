import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./TasksPage.css";
import Sidebar from "../../components/dashboard_components/Sidebar";
import WelcomeHeader from "../../components/dashboard_components/WelcomeHeader";

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
        priorityLevel: "medium",
        deadline: new Date().toISOString().split('T')[0],
        addToCalendar: false,
        scheduleStudyBlocks: false
    });
    const [editingTask, setEditingTask] = useState(null);
    const [showEditTaskModal, setShowEditTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);


    const [sortOption, setSortOption] = useState("deadline-asc");
    const [filterOptions, setFilterOptions] = useState({
        course: "",
        type: "",
        status: "",
        priority: ""
    });
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState("grid");
    const [searchQuery, setSearchQuery] = useState("");

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


    const handleSettings = () => {
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

    const calculatePriorityScore = (priorityLevel) => {
        const defaultScores = {
            high: 9,
            medium: 5,
            low: 2
        };

        if (tasks.length === 0) {
            return defaultScores[priorityLevel];
        }

        const priorityScores = tasks.map(task => parseFloat(task.priority)).filter(score => !isNaN(score));

        if (priorityScores.length === 0) {
            return defaultScores[priorityLevel];
        }

        const minScore = Math.min(...priorityScores);
        const maxScore = Math.max(...priorityScores);
        const avgScore = priorityScores.reduce((sum, score) => sum + score, 0) / priorityScores.length;

        const dynamicScores = {
            high: Math.min(maxScore + 1, 10),
            medium: avgScore,
            low: Math.max(minScore - 1, 1)
        };

        return dynamicScores[priorityLevel];
    };

    const handleSubmitNewTask = async (e) => {
        e.preventDefault();
        try {
            const priorityScore = calculatePriorityScore(newTask.priorityLevel);

            const taskData = {
                ...newTask,
                priority: priorityScore,
                requiresStudyBlock: newTask.scheduleStudyBlocks
            };

            const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/task/create`, taskData, {
                withCredentials: true
            });

            if (newTask.addToCalendar && response.data) {
                const taskId = response.data.id;
                const deadline = new Date(newTask.deadline);

                await axios.post(`${import.meta.env.VITE_SERVER_URL}/user/calendar-events`, {
                    taskId,
                    start_time: deadline,
                    end_time: deadline,
                    type: 'TASK_BLOCK',
                    is_group_event: false,
                    location: 'Zuno App'
                }, {
                    withCredentials: true
                });
            }

            handleCloseAddTaskModal();
            fetchTasks();
        } catch (err) {
            console.error("Error creating task:", err);
            alert("Failed to create task. Please try again.");
        }
    };

    const handleEditTask = async (task) => {
        let priorityLevel = "medium";
        if (task.priority >= priorityThresholds.high) priorityLevel = "high";
        else if (task.priority < priorityThresholds.medium) priorityLevel = "low";

        try {
            const calendarResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/calendar-events?taskId=${task.id}`, {
                withCredentials: true
            });

            const hasCalendarEvent = calendarResponse.data.some(event => event.taskId === task.id);

            setEditingTask({
                ...task,
                priorityLevel: priorityLevel,
                originalPriorityLevel: priorityLevel,
                deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
                addToCalendar: hasCalendarEvent,
                scheduleStudyBlocks: task.requiresStudyBlock
            });
            setShowEditTaskModal(true);
        } catch (err) {
            console.error("Error checking calendar events:", err);

            setEditingTask({
                ...task,
                priorityLevel: priorityLevel,
                originalPriorityLevel: priorityLevel,
                deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
                addToCalendar: false,
                scheduleStudyBlocks: task.requiresStudyBlock
            });
            setShowEditTaskModal(true);
        }
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
        const { name, value, type, checked } = e.target;
        setEditingTask(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmitEditTask = async (e) => {
        e.preventDefault();
        try {
            let priorityScore = parseFloat(editingTask.priority);

            if (editingTask.priorityLevel && editingTask.originalPriorityLevel !== editingTask.priorityLevel) {
                priorityScore = calculatePriorityScore(editingTask.priorityLevel);
            }

            const taskData = {
                ...editingTask,
                priority: priorityScore,
                requiresStudyBlock: editingTask.scheduleStudyBlocks
            };

            await axios.put(`${import.meta.env.VITE_SERVER_URL}/task/${editingTask.id}`, taskData, {
                withCredentials: true
            });

            const calendarResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/calendar-events?taskId=${editingTask.id}`, {
                withCredentials: true
            });

            const existingEvent = calendarResponse.data.find(event => event.taskId === editingTask.id);
            const deadline = new Date(editingTask.deadline);

            if (editingTask.addToCalendar) {
                if (existingEvent) {
                    await axios.put(`${import.meta.env.VITE_SERVER_URL}/user/calendar-events/${existingEvent.id}`, {
                        start_time: deadline,
                        end_time: deadline,
                        type: 'TASK_BLOCK',
                        is_group_event: false,
                        location: 'Zuno App'
                    }, {
                        withCredentials: true
                    });
                } else {
                    await axios.post(`${import.meta.env.VITE_SERVER_URL}/user/calendar-events`, {
                        taskId: editingTask.id,
                        start_time: deadline,
                        end_time: deadline,
                        type: 'TASK_BLOCK',
                        is_group_event: false,
                        location: 'Zuno App'
                    }, {
                        withCredentials: true
                    });
                }
            } else if (!editingTask.addToCalendar && existingEvent) {
                await axios.delete(`${import.meta.env.VITE_SERVER_URL}/user/calendar-events/${existingEvent.id}`, {
                    withCredentials: true
                });
            }

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

    const calculatePriorityThresholds = () => {
        if (tasks.length === 0) {
            return { high: 8, medium: 4 };
        }

        const priorityScores = tasks.map(task => parseFloat(task.priority)).filter(score => !isNaN(score));

        if (priorityScores.length === 0) {
            return { high: 8, medium: 4 };
        }

        priorityScores.sort((a, b) => a - b);

        const highThreshold = priorityScores[Math.floor(priorityScores.length * 0.67)] || 8;
        const mediumThreshold = priorityScores[Math.floor(priorityScores.length * 0.33)] || 4;

        return { high: highThreshold, medium: mediumThreshold };
    };

    const [priorityThresholds, setPriorityThresholds] = useState({ high: 8, medium: 4 });

    useEffect(() => {
        setPriorityThresholds(calculatePriorityThresholds());
    }, [tasks]);

    const getPriorityLabel = (priority) => {
        if (priority >= priorityThresholds.high) return "High";
        if (priority >= priorityThresholds.medium) return "Medium";
        return "Low";
    };

    const getPriorityClass = (priority) => {
        if (priority >= priorityThresholds.high) return "priority-high";
        if (priority >= priorityThresholds.medium) return "priority-medium";
        return "priority-low";
    };

    const getSourceLabel = (source) => {
        return source === "canvas" ? "Canvas" : "User";
    };

    const getSourceClass = (source) => {
        return source === "canvas" ? "source-canvas" : "source-user";
    };

    const stripHtmlTags = (html) => {
        if (!html) return "";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || "";
    };

    const getSortedAndFilteredTasks = () => {
        let filteredTasks = [...tasks];

        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase().trim();
            filteredTasks = filteredTasks.filter(task =>
                task.title.toLowerCase().includes(query) ||
                (task.description && task.description.toLowerCase().includes(query))
            );
        }

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
                if (filterOptions.priority === "high") return priorityValue >= priorityThresholds.high;
                if (filterOptions.priority === "medium") return priorityValue >= priorityThresholds.medium && priorityValue < priorityThresholds.high;
                if (filterOptions.priority === "low") return priorityValue < priorityThresholds.medium;
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
                <WelcomeHeader
                    title="Tasks"
                    subtitle="Manage your assignments, quizzes, and other tasks."
                    onSettingsClick={handleSettings}
                />

                <div className="tasks-container">
                    <div className="tasks-header">
                        <div className="tasks-controls">
                            <div className="search-container">
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
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

                    <div className="tasks-summary">
                        <div className="tasks-metrics">
                            <div className="metric-item">
                                <span className="metric-value">{tasks.filter(task => task.completed).length}</span>
                                <span className="metric-label">Completed</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-value">{tasks.filter(task => !task.completed).length}</span>
                                <span className="metric-label">Remaining</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-value">{tasks.length}</span>
                                <span className="metric-label">Total</span>
                            </div>
                        </div>
                        <div className="tasks-legend">
                            <div className="legend-item">
                                <div className="legend-color canvas"></div>
                                <span>Canvas Tasks</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-color user"></div>
                                <span>User Created Tasks</span>
                            </div>
                        </div>
                    </div>
                    <div className={`tasks-list ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
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
                                    className={`task-card ${task.completed ? 'completed' : ''} ${getSourceClass(task.source)}`}
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
                                            <div className="task-title-wrapper">
                                                <h3 className="task-title">{task.title}</h3>
                                                {task.source === "canvas" && (
                                                    <span className="source-badge canvas-badge" title="Imported from Canvas">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M21 16V8.00002C20.9996 7.6493 20.9071 7.30483 20.7315 7.00119C20.556 6.69754 20.3037 6.44539 20 6.27002L13 2.27002C12.696 2.09449 12.3511 2.00208 12 2.00208C11.6489 2.00208 11.304 2.09449 11 2.27002L4 6.27002C3.69626 6.44539 3.44398 6.69754 3.26846 7.00119C3.09294 7.30483 3.00036 7.6493 3 8.00002V16C3.00036 16.3508 3.09294 16.6952 3.26846 16.9989C3.44398 17.3025 3.69626 17.5547 4 17.73L11 21.73C11.304 21.9056 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9056 13 21.73L20 17.73C20.3037 17.5547 20.556 17.3025 20.7315 16.9989C20.9071 16.6952 20.9996 16.3508 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
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
                                    <label htmlFor="priorityLevel">Priority</label>
                                    <select
                                        id="priorityLevel"
                                        name="priorityLevel"
                                        value={newTask.priorityLevel}
                                        onChange={handleNewTaskChange}
                                    >
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
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
                                <div className="form-group checkbox-group">
                                    <input
                                        type="checkbox"
                                        id="addToCalendar"
                                        name="addToCalendar"
                                        checked={newTask.addToCalendar}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setNewTask(prev => ({
                                                ...prev,
                                                addToCalendar: isChecked,
                                                scheduleStudyBlocks: isChecked ? prev.scheduleStudyBlocks : false
                                            }));
                                        }}
                                    />
                                    <label htmlFor="addToCalendar">Add to Calendar</label>
                                </div>
                                {newTask.addToCalendar && (
                                    <div className="form-group checkbox-group indented">
                                        <input
                                            type="checkbox"
                                            id="scheduleStudyBlocks"
                                            name="scheduleStudyBlocks"
                                            checked={newTask.scheduleStudyBlocks}
                                            onChange={(e) => {
                                                setNewTask(prev => ({
                                                    ...prev,
                                                    scheduleStudyBlocks: e.target.checked
                                                }));
                                            }}
                                        />
                                        <label htmlFor="scheduleStudyBlocks">Schedule Study Blocks for this Task</label>
                                    </div>
                                )}
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
                                        <div className="task-detail-label">Source</div>
                                        <div className="task-detail-value">
                                            <span className={`source-badge-detail ${getSourceClass(selectedTask.source)}-detail`}>
                                                {getSourceLabel(selectedTask.source)}
                                            </span>
                                        </div>
                                    </div>
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
                                    <label htmlFor="priorityLevel">Priority</label>
                                    <select
                                        id="priorityLevel"
                                        name="priorityLevel"
                                        value={editingTask.priorityLevel}
                                        onChange={handleEditTaskChange}
                                    >
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
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
                                <div className="form-group checkbox-group">
                                    <input
                                        type="checkbox"
                                        id="edit-addToCalendar"
                                        name="addToCalendar"
                                        checked={editingTask.addToCalendar}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setEditingTask(prev => ({
                                                ...prev,
                                                addToCalendar: isChecked,
                                                scheduleStudyBlocks: isChecked ? prev.scheduleStudyBlocks : false
                                            }));
                                        }}
                                    />
                                    <label htmlFor="edit-addToCalendar">Add to Calendar</label>
                                </div>
                                {editingTask.addToCalendar && (
                                    <div className="form-group checkbox-group indented">
                                        <input
                                            type="checkbox"
                                            id="edit-scheduleStudyBlocks"
                                            name="scheduleStudyBlocks"
                                            checked={editingTask.scheduleStudyBlocks}
                                            onChange={(e) => {
                                                setEditingTask(prev => ({
                                                    ...prev,
                                                    scheduleStudyBlocks: e.target.checked
                                                }));
                                            }}
                                        />
                                        <label htmlFor="edit-scheduleStudyBlocks">Schedule Study Blocks for this Task</label>
                                    </div>
                                )}
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
