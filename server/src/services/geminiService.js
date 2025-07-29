const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured in environment variables');
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }

    async getUserContext(userId) {
        try {
            const [user, courses, tasks, analytics] = await Promise.all([
                prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        preferredStudyTime: true
                    }
                }),
                prisma.course.findMany({
                    where: { userId },
                    select: {
                        course_name: true,
                        course_code: true,
                        instructor_name: true,
                        current_grade: true,
                        current_score: true
                    }
                }),
                prisma.task.findMany({
                    where: { userId },
                    select: {
                        title: true,
                        description: true,
                        type: true,
                        priority: true,
                        deadline: true,
                        completed: true,
                        studyTime: true,
                        course: {
                            select: {
                                course_name: true,
                                course_code: true
                            }
                        }
                    },
                    orderBy: { deadline: 'asc' },
                    take: 10
                }),
                prisma.analytics.findUnique({
                    where: { userId },
                    select: {
                        tasks_completed: true,
                        total_study_hours: true,
                        engagement_score: true
                    }
                })
            ]);

            return {
                user,
                courses,
                tasks,
                analytics
            };
        } catch (error) {
            console.error('Error fetching user context:', error);
            return null;
        }
    }

    buildSystemPrompt(userContext) {
        if (!userContext) {
            return `You are Zuno, an AI study assistant. Help students with their academic questions, study strategies, and coursework guidance. Be helpful, encouraging, and provide practical advice.`;
        }

        const { user, courses, tasks, analytics } = userContext;

        let systemPrompt = `You are Zuno, an AI study assistant helping ${user?.firstName || 'the student'}.

STUDENT CONTEXT:
- Name: ${user?.firstName} ${user?.lastName}
- Email: ${user?.email}`;

        if (courses && courses.length > 0) {
            systemPrompt += `\n\nCURRENT COURSES:`;
            courses.forEach(course => {
                systemPrompt += `\n- ${course.course_name} (${course.course_code})`;
                if (course.instructor_name) systemPrompt += ` - Instructor: ${course.instructor_name}`;
                if (course.current_grade) systemPrompt += ` - Current Grade: ${course.current_grade}`;
                if (course.current_score) systemPrompt += ` (${course.current_score}%)`;
            });
        }

        if (tasks && tasks.length > 0) {
            systemPrompt += `\n\nUPCOMING TASKS & ASSIGNMENTS:`;
            tasks.slice(0, 5).forEach(task => {
                const dueDate = task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No due date';
                const status = task.completed ? 'Completed' : 'Pending';
                const priority = task.priority ? `Priority: ${task.priority}` : '';
                const studyTime = task.studyTime ? `Est. Study Time: ${task.studyTime}h` : '';

                systemPrompt += `\n\n• ${task.title} (${task.course?.course_name || 'Unknown Course'})`;
                systemPrompt += `\n  - Type: ${task.type || 'Assignment'}`;
                systemPrompt += `\n  - Due: ${dueDate}`;
                systemPrompt += `\n  - Status: ${status}`;
                if (priority) systemPrompt += `\n  - ${priority}`;
                if (studyTime) systemPrompt += `\n  - ${studyTime}`;
                if (task.description && task.description.trim()) {
                    systemPrompt += `\n  - Description: ${task.description.substring(0, 200)}${task.description.length > 200 ? '...' : ''}`;
                }
            });
        }

        if (analytics) {
            systemPrompt += `\n\nSTUDY ANALYTICS:`;
            systemPrompt += `\n- Tasks Completed: ${analytics.tasks_completed || 0}`;
            systemPrompt += `\n- Total Study Hours: ${analytics.total_study_hours || 0}`;
            systemPrompt += `\n- Engagement Score: ${analytics.engagement_score || 0}`;
        }

        systemPrompt += `\n\nINSTRUCTIONS:
- Provide personalized study assistance based on the student's current courses and tasks
- Be encouraging and supportive
- Offer practical study strategies and tips
- Help with time management and organization
- Answer questions about course content when possible
- Suggest study schedules and priorities based on upcoming deadlines
- Keep responses concise but helpful
- If asked about specific assignments, refer to the task list above
- Always maintain a friendly, professional tone`;

        return systemPrompt;
    }
    async getOrCreateActiveConversation(userId) {
        try {
            let conversation = await prisma.chatConversation.findFirst({
                where: {
                    userId,
                    isActive: true
                },
                include: {
                    messages: {
                        orderBy: { timestamp: 'asc' },
                        take: 20
                    }
                }
            });

            if (!conversation) {
                conversation = await prisma.chatConversation.create({
                    data: {
                        userId,
                        isActive: true
                    },
                    include: {
                        messages: true
                    }
                });
            }

            return conversation;
        } catch (error) {
            console.error('Error getting/creating conversation:', error);
            return null;
        }
    }

    async generateResponse(message, userId, retryCount = 0) {
        const maxRetries = 2;

        try {
            const conversation = await this.getOrCreateActiveConversation(userId);
            if (!conversation) {
                throw new Error('Failed to get conversation');
            }

            await prisma.chatMessage.create({
                data: {
                    conversationId: conversation.id,
                    role: 'user',
                    content: message
                }
            });

            const userContext = await this.getUserContext(userId);
            const systemPrompt = this.buildSystemPrompt(userContext);

            let conversationHistory = '';
            if (conversation.messages.length > 0) {
                conversationHistory = '\n\nCONVERSATION HISTORY:\n';
                conversation.messages.forEach(msg => {
                    const role = msg.role === 'user' ? 'Student' : 'Zuno';
                    conversationHistory += `${role}: ${msg.content}\n`;
                });
            }

            const fullPrompt = `${systemPrompt}${conversationHistory}\n\nStudent Question: ${message}\n\nResponse:`;

            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();

            await prisma.chatMessage.create({
                data: {
                    conversationId: conversation.id,
                    role: 'assistant',
                    content: text
                }
            });

            await prisma.chatConversation.update({
                where: { id: conversation.id },
                data: { updatedAt: new Date() }
            });

            return {
                success: true,
                message: text,
                conversationId: conversation.id,
                error: null
            };
        } catch (error) {
            console.error('Error generating Gemini response:', error);

            if (error.status === 503 && retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
                return this.generateResponse(message, userId, retryCount + 1);
            }

            let fallbackMessage = "I'm having trouble processing your request right now. ";

            if (error.status === 503) {
                fallbackMessage += "The AI service is currently overloaded. Please try again in a few moments.";
            } else if (error.status === 400) {
                fallbackMessage += "There was an issue with your request. Please try rephrasing your question.";
            } else if (error.status === 429) {
                fallbackMessage += "I'm receiving too many requests right now. Please wait a moment and try again.";
            } else {
                fallbackMessage += "Please try again in a moment, or feel free to ask me about your studies, assignments, or any academic topics you'd like help with.";
            }

            return {
                success: false,
                message: fallbackMessage,
                error: error.message
            };
        }
    }


}

module.exports = new GeminiService();
