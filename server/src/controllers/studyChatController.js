const geminiService = require('../services/geminiService');

const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                error: 'Message is required and must be a non-empty string'
            });
        }

        if (message.length > 2000) {
            return res.status(400).json({
                error: 'Message is too long. Please keep it under 2000 characters.'
            });
        }

        const aiResponse = await geminiService.generateResponse(message, userId);

        if (!aiResponse.success) {
            return res.status(500).json({
                error: 'Failed to generate response',
                message: aiResponse.message
            });
        }

        res.status(200).json({
            success: true,
            message: aiResponse.message,
            conversationId: aiResponse.conversationId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in study chat:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Something went wrong while processing your message. Please try again.'
        });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.query;

        const messages = await geminiService.getChatHistory(userId, conversationId);

        res.status(200).json({
            success: true,
            messages: messages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
            }))
        });

    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({
            error: 'Failed to fetch chat history'
        });
    }
};

const startNewChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { deletePrevious = false } = req.body;

        const newConversation = await geminiService.startNewConversation(userId, deletePrevious);

        if (!newConversation) {
            return res.status(500).json({
                error: 'Failed to start new conversation'
            });
        }

        res.status(200).json({
            success: true,
            conversationId: newConversation.id,
            message: deletePrevious ? 'New conversation started and previous history deleted' : 'New conversation started successfully'
        });

    } catch (error) {
        console.error('Error starting new chat:', error);
        res.status(500).json({
            error: 'Failed to start new conversation'
        });
    }
};

const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        const conversations = await geminiService.getConversationList(userId);

        res.status(200).json({
            success: true,
            conversations
        });

    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({
            error: 'Failed to fetch conversations'
        });
    }
};

const getStudyContext = async (req, res) => {
    try {
        const userId = req.user.id;

        const userContext = await geminiService.getUserContext(userId);

        if (!userContext) {
            return res.status(500).json({
                error: 'Failed to fetch study context'
            });
        }

        res.status(200).json({
            success: true,
            context: userContext
        });

    } catch (error) {
        console.error('Error fetching study context:', error);
        res.status(500).json({
            error: 'Failed to fetch study context'
        });
    }
};

module.exports = {
    sendMessage,
    getChatHistory,
    startNewChat,
    getConversations,
    getStudyContext
};
