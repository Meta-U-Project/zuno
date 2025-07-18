const { PrismaClient } = require('../generated/prisma');
const { syncCanvasData } = require('../utils/syncCanvasData');
const prisma = new PrismaClient();

const saveCanvasCredentials = async (req, res) => {
    const { domain, accessToken } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                canvasDomain: domain,
                canvasAccessToken: accessToken
            }
        });

        const googleConnected = !!updatedUser.googleAccessToken;

        await syncCanvasData(updatedUser);

        res.status(200).json({
            message: 'Canvas credentials saved successfully',
            redirectToDashboard: googleConnected,
            integrations: {
                googleConnected,
                canvasConnected: true
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong saving credentials' });
    }
};

const fetchCourses = async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            where: { userId: req.user.id }
        });
        res.status(200).json(courses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong fetching courses' });
    }
};

const fetchCanvasTasks = async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { userId: req.user.id },
            include: { course: true }
        });
        const analytics = await prisma.analytics.findUnique({
            where: { userId: req.user.id }
        });
        res.status(200).json({ assignments: tasks, analytics });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong fetching assignments' });
    }
};

const fetchCalendarEventsFromTasks = async (req, res) => {
    try {
        const calendarEvents = await prisma.calendarEvent.findMany({
            where: { userId: req.user.id },
            include: {
                task: {
                    include: {
                        course: true
                    }
                }
            }
        });

        const transformedEvents = calendarEvents.map(event => {
            const isStudyBlock = event.location === 'Study Session';

            const taskType = isStudyBlock ? 'task_block' : event.task.type.toLowerCase();

            const formattedTime = isStudyBlock ?
                new Date(event.start_time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                }) : '';

            const title = isStudyBlock ?
                `Study Block for ${event.task.title} (${formattedTime})` :
                event.task.title;

            return {
                id: event.id,
                title: title,
                date: event.start_time,
                type: taskType,
                courseId: event.task.courseId,
                courseName: event.task.course.course_name,
                url: ''
            };
        });

        res.status(200).json(transformedEvents);
    } catch (err) {
        console.error('Error fetching calendar events:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const fetchAnnouncements = async (req, res) => {
    try {
        const announcements = await prisma.announcement.findMany({
            where: { userId: req.user.id }
        });

        res.status(200).json(announcements);
    } catch (err) {
        console.error('Error fetching announcements:', err.message);
        res.status(500).json({ error: 'Something went wrong fetching announcements' });
    }
};

module.exports = {
    saveCanvasCredentials,
    fetchCourses,
    fetchCanvasTasks,
    fetchCalendarEventsFromTasks,
    fetchAnnouncements
};
