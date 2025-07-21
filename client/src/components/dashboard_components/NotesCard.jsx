import React, { useState, useEffect } from "react";
import "./NotesCard.css";

const NotesCard = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentNotes = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/notes`, {
                    credentials: 'include',
                });

                if (response.ok) {
                    const notesData = await response.json();
                    const sortedNotes = notesData
                        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                        .slice(0, 4);
                    setNotes(sortedNotes);
                } else {
                    console.error('Failed to fetch notes');
                }
            } catch (error) {
                console.error('Error fetching notes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentNotes();
    }, []);

    const formatTimeAgo = (date) => {
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays}d ago`;

        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks === 1) return '1w ago';
        return `${diffInWeeks}w ago`;
    };

    const stripHtml = (html) => {
        if (!html) return '';

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const textContent = tempDiv.textContent || tempDiv.innerText || '';

        return textContent;
    };

    const truncateContent = (content, maxLength = 80) => {
        const plainText = stripHtml(content);

        if (plainText.length <= maxLength) return plainText;
        return plainText.substring(0, maxLength) + '...';
    };

    if (loading) {
        return (
            <div className="dashboard-card notes-card">
                <div className="card-header">
                    <h3>Recent Notes</h3>
                </div>
                <div className="card-content">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading your notes...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-card notes-card">
            <div className="card-header">
                <h3>Recent Notes</h3>
                <a href="/notes" className="view-all-link">view all</a>
            </div>
            <div className="card-content">
                {notes.length > 0 ? (
                    <div className="notes-list">
                        {notes.map((note) => (
                            <div key={note.id} className="dash-note-item">
                                <div className="note-main">
                                    <div className="note-header">
                                        <h4 className="note-title">{note.title}</h4>
                                        <span className="note-time">{formatTimeAgo(new Date(note.updatedAt))}</span>
                                    </div>
                                    <p className="note-content">{truncateContent(note.content)}</p>
                                    <div className="note-footer">
                                        {note.courseName && (
                                            <span className="note-course">{note.courseName}</span>
                                        )}
                                        <div className="note-tags">
                                            {note.tags && note.tags.slice(0, 2).map((tag, index) => (
                                                <span key={index} className="note-tag">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14 2V8H20" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M16 13H8" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M16 17H8" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M10 9H9H8" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <p>No notes yet</p>
                        <span>Start taking notes to see them here</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesCard;
