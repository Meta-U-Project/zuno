import React from 'react';
import './Loading.css';

const Loading = ({ message = "Loading..." }) => {
    return (
        <div className="loading-overlay">
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-message">{message}</p>
            </div>
        </div>
    );
};

export default Loading;
