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
            await axios.post(`${import.meta.env.VITE_SERVER_URL}/task/create`, newTask, {
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
            await axios.put(`${import.meta.env.VITE_SERVER_URL}/task/${editingTask.id}`, editingTask, {
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

    // Close dropdown when clicking outside
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
                        <button className="add-task-button" onClick={handleAddTask}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Add Task
                        </button>
                    </div>

                    <div className="tasks-list">
                        {tasks.length === 0 ? (
                            <div className="no-tasks">
                                <p>You don't have any tasks yet. Click "Add Task" to create one.</p>
                            </div>
                        ) : (
                            tasks.map(task => (
                                <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
                                    <div className="task-header">
                                        <div className="task-title-container">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => handleToggleComplete(task)}
                                                className="task-checkbox"
                                            />
                                            <h3 className="task-title">{task.title}</h3>
                                        </div>
                                        <div className="task-actions">
                                            <button className="task-action-button edit" onClick={() => handleEditTask(task)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                            <button className="task-action-button delete" onClick={() => handleDeleteTask(task.id)}>
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
                                    {task.description && (
                                        <div className="task-description">
                                            <p>{task.description}</p>
                                        </div>
                                    )}
                                </div>
                            ))
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
