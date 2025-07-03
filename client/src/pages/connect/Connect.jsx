import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";
import "./Connect.css";

const ConnectPage = () => {
    const [googleConnected, setGoogleConnected] = useState(false);
    const [canvasConnected, setCanvasConnected] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const checkIntegrationStatus = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/user/integrations`, {
                credentials: "include",
            });
            const data = await response.json();
            setGoogleConnected(data.googleConnected);
            setCanvasConnected(data.canvasConnected);

            if (data.googleConnected && data.canvasConnected) {
                setIsRedirecting(true);
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            }
        } catch (err) {
            console.error("Error checking integration status:", err);
        }
    };

    useEffect(() => {
        checkIntegrationStatus();

        const urlParams = new URLSearchParams(location.search);
        if (urlParams.get('google') === 'connected') {
            setGoogleConnected(true);
        }
        if (urlParams.get('canvas') === 'connected') {
            setCanvasConnected(true);
        }
    }, [location]);

    const handleContinue = () => {
        window.location.href = "/dashboard";
    };

    if (isRedirecting) {
        return <Loading message="Both accounts connected successfully! Redirecting to dashboard..." />;
    }

    return (
    <div>
        <nav className='navbar'>
            <div className='nav-left'>
                <span>zuno.</span>
            </div>
        </nav>
        <div className="connect-container">
            <h1 className="connect-heading">Connect Your Accounts</h1>
            <p className="connect-subtext">
                To continue, please connect your Google Calendar and Canvas account.
            </p>

            <div className="connect-buttons">
                <button
                    onClick={() =>
                        (window.location.href = `${import.meta.env.VITE_SERVER_URL}/google/auth`)
                    }
                    disabled={googleConnected}
                    className={`connect-btn google ${googleConnected ? "connected" : ""}`}
                >
                    <div className="btn-content">
                        <img
                            src="https://developers.google.com/identity/images/g-logo.png"
                            alt="Google Logo"
                            className="btn-logo"
                        />
                        <span>{googleConnected ? "Google Connected" : "Connect Google Calendar"}</span>
                    </div>
                </button>

                <button
                onClick={() => (window.location.href = "/canvas-auth")}
                disabled={canvasConnected}
                className={`connect-btn canvas ${canvasConnected ? "connected" : ""}`}
                >
                    <div className="btn-content">
                        <img
                            src="https://www.instructure.com/sites/default/files/image/2021-12/Canvas_logo_single_mark.png"
                            alt="Canvas Logo"
                            className="btn-logo"
                        />
                        <span>{canvasConnected ? "Canvas Connected" : "Connect Canvas"}</span>
                    </div>
                </button>
            </div>

            <button
                onClick={handleContinue}
                disabled={!(googleConnected && canvasConnected)}
                className="continue-btn"
            >
                Continue to Dashboard
            </button>
        </div>
    </div>
);
};

export default ConnectPage;
