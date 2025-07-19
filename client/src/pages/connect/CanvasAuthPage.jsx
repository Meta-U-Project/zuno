import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConnectCanvas from './ConnectCanvas';
import Loading from '../../components/Loading';

const CanvasAuthPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCanvasSubmit = async ({ domain, accessToken }) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/canvas/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ domain, accessToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save Canvas credentials');
            }

            if (data.redirectToDashboard) {
                navigate('/dashboard?canvas=connected');
            } else {
                navigate('/connect?canvas=connected');
            }

        } catch (err) {
            console.error('Canvas auth error:', err);
            setError(err.message || 'Failed to connect Canvas. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <Loading message="Connecting to Canvas..." />;
    }

    return (
        <div>
            <nav className='navbar'>
                <div className='nav-left'>
                    <span>zuno.</span>
                </div>
            </nav>
            {error && (
                <div style={{
                    background: '#fee',
                    color: '#c33',
                    padding: '1rem',
                    margin: '1rem',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    {error}
                </div>
            )}
            <ConnectCanvas onSubmit={handleCanvasSubmit} />
        </div>
    );
};

export default CanvasAuthPage;
