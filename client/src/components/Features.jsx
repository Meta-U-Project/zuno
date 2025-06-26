import React from "react";
import "./Features.css";

const Features = () => {
    const features = [
        {
            id: 1,
            icon: "icons/note.png",
            title: "Smart Scheduling",
            description: "Automatically plan study sessions based on task priority, deadlines, and course difficulty."
            },
            {
            id: 2,
            icon: "icons/task.png",
            title: "Task & Calendar Management",
            description: "Create, view, and manage assignments, quizzes, and study blocks in a unified calendar."
            },
            {
            id: 3,
            icon: "icons/analytics.png",
            title: "Analytics Dashboard",
            description: "Track study time and monitor course progress with helpful insights."
            },
            {
            id: 4,
            icon: "icons/notifs.png",
            title: "Multichannel Notifications",
            description: "Receive reminders through email, SMS, and in-app alerts for important deadlines and sessions."
            },
            {
            id: 5,
            icon: "icons/notetaking.png",
            title: "Note Taking",
            description: "Write and store notes directly within your dashboard for organized study."
            },
            {
            id: 6,
            icon: "icons/handshake.png",
            title: "Tutor & Student Dashboards",
            description: "Students manage tasks and tutors oversee engagement and availability."
            }
    ];

    return (
        <div className="feature">
        <div className="features-grid">
            {features.map((feature) => (
            <div key={feature.id} className="feature-item">
                <div className="feature-circle">
                    <img className="feature-icon" src={feature.icon}/>
                </div>
                <div className="feature-content">
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">{feature.description}</p>
                </div>
            </div>
            ))}
        </div>
        </div>
    );
};

export default Features;
