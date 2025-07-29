import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeItem, setActiveItem] = useState("dashboard");

    const navigationItems = [
        { id: "dashboard", label: "Dashboard", path: "/dashboard" },
        { id: "courses", label: "Courses", path: "/courses" },
        { id: "calendar", label: "Calendar", path: "/calendar" },
        { id: "tasks", label: "Tasks", path: "/tasks" },
        { id: "notes", label: "Notes", path: "/notes" },
        { id: "notifications", label: "Notifications", path: "/notifications" },
        // { id: "inbox", label: "Inbox", path: "/inbox" },
        { id: "study-chat", label: "Study Chat", path: "/study-chat" }
    ];

    useEffect(() => {
        const currentPath = location.pathname;
        const currentItem = navigationItems.find(item => item.path === currentPath);
        if (currentItem) {
            setActiveItem(currentItem.id);
        }
    }, [location.pathname]);

    const handleNavigation = (item) => {
        setActiveItem(item.id);
        navigate(item.path);
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <span className="logo-text">zuno.</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <ul className="nav-list">
                    {navigationItems.map((item) => (
                        <li key={item.id} className="nav-item">
                            <button
                                className={`nav-button ${activeItem === item.id ? 'active' : ''}`}
                                onClick={() => handleNavigation(item)}
                            >
                                <span className="nav-icon">
                                    {item.id === "dashboard" && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                    {item.id === "courses" && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                    {item.id === "calendar" && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                    {item.id === "tasks" && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M21 12V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                    {item.id === "notes" && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M14 2H6A2 2 0 0 0 4 4V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                    {item.id === "notifications" && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                    {item.id === "inbox" && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <polyline points="22,12 18,12 15,21 9,21 6,12 2,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M5.45 5.11L2 12V18A2 2 0 0 0 4 20H20A2 2 0 0 0 22 18V12L18.55 5.11A2 2 0 0 0 16.76 4H7.24A2 2 0 0 0 5.45 5.11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                    {item.id === "study-chat" && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 15A2 2 0 0 1 19 17H7L4 20V6A2 2 0 0 1 6 4H19A2 2 0 0 1 21 6V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </span>
                                <span className="nav-label">{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

        </div>
    );
};

export default Sidebar;
