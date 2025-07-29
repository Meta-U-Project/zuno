import { useState, useEffect, useRef } from "react";
import "./StudyChatPage.css";
import Sidebar from "../../components/dashboard_components/Sidebar";
import WelcomeHeader from "../../components/dashboard_components/WelcomeHeader";
import ConfirmationModal from "../../components/ConfirmationModal";
import FormattedMessage from "../../components/FormattedMessage";

const StudyChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        loadChatHistory();
    }, []);

    const loadChatHistory = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/study-chat/history`, {
                method: 'GET',
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                if (data.messages.length === 0) {
                    setMessages([{
                        id: 'welcome',
                        type: 'bot',
                        content: "Hi! I'm Zuno, your AI study assistant. I'm here to help you with your studies, answer questions about your courses, and provide study guidance. How can I help you today?",
                        timestamp: new Date()
                    }]);
                } else {
                    const formattedMessages = data.messages.map(msg => ({
                        id: msg.id,
                        type: msg.role === 'user' ? 'user' : 'bot',
                        content: msg.content,
                        timestamp: new Date(msg.timestamp)
                    }));
                    setMessages(formattedMessages);
                }
            } else {
                setMessages([{
                    id: 'welcome',
                    type: 'bot',
                    content: "Hi! I'm Zuno, your AI study assistant. I'm here to help you with your studies, answer questions about your courses, and provide study guidance. How can I help you today?",
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            setMessages([{
                id: 'welcome',
                type: 'bot',
                content: "Hi! I'm Zuno, your AI study assistant. I'm here to help you with your studies, answer questions about your courses, and provide study guidance. How can I help you today?",
                timestamp: new Date()
            }]);
        }
    };

    const handleNewChatClick = () => {
        const hasConversation = messages.length > 1 || (messages.length === 1 && !messages[0].id.includes('welcome'));

        if (hasConversation) {
            setShowConfirmModal(true);
        } else {
            startNewChat(false);
        }
    };

    const startNewChat = async (deletePrevious = false) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/study-chat/new-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    deletePrevious
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessages([{
                    id: 'welcome-new',
                    type: 'bot',
                    content: "Hi! I'm Zuno, your AI study assistant. I'm here to help you with your studies, answer questions about your courses, and provide study guidance. How can I help you today?",
                    timestamp: new Date()
                }]);
                setShowConfirmModal(false);
            } else {
                console.error('Failed to start new chat:', data.error);
            }
        } catch (error) {
            console.error('Error starting new chat:', error);
        }
    };

    const handleConfirmNewChat = async () => {
        await startNewChat(true);
    };

    const handleCancelNewChat = () => {
        setShowConfirmModal(false);
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputMessage.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const messageToSend = inputMessage.trim();
        setInputMessage("");
        setIsLoading(true);
        setIsTyping(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/study-chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    message: messageToSend
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const botResponse = {
                    id: Date.now() + 1,
                    type: 'bot',
                    content: data.message,
                    timestamp: new Date(data.timestamp)
                };

                setMessages(prev => [...prev, botResponse]);
            } else {
                const errorMessage = {
                    id: Date.now() + 1,
                    type: 'bot',
                    content: data.message || "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Error sending message:', error);

            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: "I'm sorry, I'm having trouble connecting right now. Please check your internet connection and try again.",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (timestamp) => {
        return timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };


    const handleSettings = () => {
        // Settings functionality can be added later
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="dashboard-main">
                <WelcomeHeader
                    title="Study Chat"
                    subtitle="Get personalized study assistance and academic support from Zuno AI."
                    onSettingsClick={handleSettings}
                    customActions={
                        <button
                            onClick={handleNewChatClick}
                            className="new-chat-button"
                            disabled={isLoading}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            New Chat
                        </button>
                    }
                />

                <div className="chat-container">
                    <div className="chat-content">
                        <div className="messages-container">
                            {messages.map((message) => (
                                <div key={message.id} className={`message ${message.type}`}>
                                    <div className="message-avatar">
                                        {message.type === 'bot' ? (
                                            <div className="bot-avatar">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="user-avatar">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M20 21V19A4 4 0 0 0 16 15H8A4 4 0 0 0 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="message-content">
                                        <div className="message-bubble">
                                            <FormattedMessage content={message.content} />
                                        </div>
                                        <div className="message-time">
                                            {formatTime(message.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="message bot">
                                    <div className="message-avatar">
                                        <div className="bot-avatar">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="message-content">
                                        <div className="message-bubble typing">
                                            <div className="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                    </div>

                    <div className="chat-input-container">
                        <div className="chat-input-wrapper">
                            <textarea
                                ref={inputRef}
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask me anything about your studies..."
                                className="chat-input"
                                rows="1"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSendMessage}
                                className={`send-button ${inputMessage.trim() && !isLoading ? 'active' : ''}`}
                                disabled={!inputMessage.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <div className="loading-spinner small"></div>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <polygon points="22,2 15,22 11,13 2,9 22,2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                        <div className="chat-input-footer">
                            <p>Zuno AI can make mistakes. Please verify important information.</p>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={handleCancelNewChat}
                onConfirm={handleConfirmNewChat}
                title="Start New Chat?"
                message="Starting a new chat will permanently delete your current conversation history to save database space. This action cannot be undone. Are you sure you want to continue?"
                confirmText="Delete & Start New"
                cancelText="Cancel"
                type="warning"
            />
        </div>
    );
};

export default StudyChatPage;
