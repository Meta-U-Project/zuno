import React, { useState, useEffect } from "react";
import "./AnalyticsCard.css";

const AnalyticsCard = () => {
    const [analyticsData, setAnalyticsData] = useState({
        zunoScore: 0,
        completedTasks: 0,
        totalTasks: 0,
        canvasCompletion: 0,
        zunoCompletion: 0,
        weeklyProgress: 0,
        loading: true
    });

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                // Fetch assignments data
                const assignmentsResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/canvas/assignments`, {
                    credentials: 'include',
                });

                let completedTasks = 0;
                let totalTasks = 0;
                let canvasCompletion = 0;

                if (assignmentsResponse.ok) {
                    const assignmentsData = await assignmentsResponse.json();
                    const assignments = assignmentsData.assignments || [];

                    totalTasks = assignments.length;
                    completedTasks = assignments.filter(assignment => assignment.completed).length;
                    canvasCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                }

                // Calculate Zuno completion (placeholder for now)
                const zunoCompletion = 75;

                // Calculate overall Zuno Score
                const zunoScore = Math.round((canvasCompletion + zunoCompletion) / 2);

                // Calculate weekly progress (based on recent activity)
                const weeklyProgress = Math.min(100, Math.round((completedTasks / Math.max(1, totalTasks * 0.3)) * 100));

                setAnalyticsData({
                    zunoScore,
                    completedTasks,
                    totalTasks,
                    canvasCompletion,
                    zunoCompletion,
                    weeklyProgress,
                    loading: false
                });

            } catch (error) {
                console.error('Error fetching analytics data:', error);
                setAnalyticsData(prev => ({ ...prev, loading: false }));
            }
        };

        fetchAnalyticsData();
    }, []);

    const getScoreLabel = (score) => {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Great';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Fair';
        return 'Needs Improvement';
    };

    if (analyticsData.loading) {
        return (
            <div className="dashboard-card analytics-card wide-card">
                <div className="card-header">
                    <h3>Your Zuno Score</h3>
                </div>
                <div className="card-content">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Calculating your performance...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-card analytics-card wide-card">
            <div className="card-header">
                <h3>Your Zuno Score</h3>
                <a href="#" className="view-all-link">view details</a>
            </div>
            <div className="card-content">
                <div className="analytics-main">
                    <div className="score-section">
                        <div className="score-circle">
                            <div
                                className="score-progress"
                                style={{
                                    background: `conic-gradient(from 0deg, #7735e2 0deg, #0a63ac ${analyticsData.zunoScore * 3.6}deg, #e2e8f0 ${analyticsData.zunoScore * 3.6}deg)`
                                }}
                            >
                                <div className="score-inner">
                                    <span className="score-number">{analyticsData.zunoScore}</span>
                                    <span className="score-label">{getScoreLabel(analyticsData.zunoScore)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="score-info">
                            <h4>Overall Performance</h4>
                            <p>Based on Canvas and Zuno task completion</p>
                        </div>
                    </div>

                    <div className="metrics-grid">
                        <div className="ana-metric-item">
                            <div className="metric-header">
                                <span className="ana-metric-label">Canvas Tasks</span>
                                <span className="metric-percentage">{analyticsData.canvasCompletion}%</span>
                            </div>
                            <div className="metric-bar">
                                <div
                                    className="metric-progress"
                                    style={{ width: `${analyticsData.canvasCompletion}%` }}
                                ></div>
                            </div>
                            <span className="metric-detail">
                                {analyticsData.completedTasks} of {analyticsData.totalTasks} completed
                            </span>
                        </div>

                        <div className="ana-metric-item">
                            <div className="metric-header">
                                <span className="ana-metric-label">Zuno Tasks</span>
                                <span className="metric-percentage">{analyticsData.zunoCompletion}%</span>
                            </div>
                            <div className="metric-bar">
                                <div
                                    className="metric-progress zuno-progress"
                                    style={{ width: `${analyticsData.zunoCompletion}%` }}
                                ></div>
                            </div>
                            <span className="metric-detail">Study sessions and notes</span>
                        </div>

                        <div className="ana-metric-item">
                            <div className="metric-header">
                                <span className="ana-metric-label">Weekly Progress</span>
                                <span className="metric-percentage">{analyticsData.weeklyProgress}%</span>
                            </div>
                            <div className="metric-bar">
                                <div
                                    className="metric-progress weekly-progress"
                                    style={{ width: `${analyticsData.weeklyProgress}%` }}
                                ></div>
                            </div>
                            <span className="metric-detail">This week's activity</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsCard;
