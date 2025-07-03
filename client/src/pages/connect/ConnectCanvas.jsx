import React, { useState } from 'react';
import './ConnectCanvas.css';

const CanvasConnect = ({ onSubmit }) => {
    const [domain, setDomain] = useState('');
    const [accessToken, setAccessToken] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (domain && accessToken) {
            onSubmit({ domain, accessToken });
        }
    };

    return (
        <div className="canvas-connect-container">
            <h1 className="canvas-title">Connect Your Canvas Account</h1>
            <p className="canvas-description">
                To fully connect your account, you'll need your Canvas domain and an access token.
                Follow the instructions below.
            </p>

            <div className="canvas-instructions">
                <h2>Step 1: Find Your Canvas Domain</h2>
                <ol>
                    <li>1. Log in to your Canvas account (e.g., <code>canvas.instructure.com</code> or your school's URL).</li>
                    <li>2. The URL in your browser (e.g., <code>https://youruniversity.instructure.com</code>) is your domain.</li>
                </ol>
                <h2>Step 2: Get Your Access Token</h2>
                <ol>
                    <li>1. While logged in, click on your profile picture in the left sidebar.</li>
                    <li>2. Click <strong>Settings</strong> from the left menu.</li>
                    <li>3. Scroll down and click <strong>+ New Access Token</strong>.</li>
                    <li>4. Name the token (e.g., “Zuno”), leave expiry blank, and click <strong>Generate Token</strong>.</li>
                    <li>5. Copy the full token shown and paste it below.</li>
                </ol>
            </div>

            <div>
                </div><form className="canvas-form" onSubmit={handleSubmit}>
                <label>
                Canvas Domain:
                <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. canvas.instructure.com"
                    required
                />
                </label>

                <label>
                Access Token:
                <input
                    type="text"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Paste your access token here"
                    required
                />
                </label>

                <button type="submit">Connect Canvas</button>
            </form>
        </div>
    );
};

export default CanvasConnect;
