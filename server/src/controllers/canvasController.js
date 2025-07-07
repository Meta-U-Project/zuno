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

const fetchAssignments = async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { userId: req.user.id },
            include: { course: true }
        });

        const analytics = {
            totalAssignments: tasks.length,
            submittedOnTime: 0, // to be updated with better logic
            submittedLate: 0,
            missing: 0
        };

        const now = new Date();
        tasks.forEach(task => {
            if (!task.completed && new Date(task.deadline) < now) {
                analytics.missing++;
            }
        });

        res.status(200).json({ assignments: tasks, analytics });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong fetching assignments' });
    }
};

const fetchCalendarEventsFromAssignments = async (req, res) => {
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

        const transformedEvents = calendarEvents.map(event => ({
            id: event.id,
            title: event.task.title,
            date: event.start_time,
            type: 'assignment',
            courseId: event.task.courseId,
            courseName: event.task.course.course_name,
            url: ''
        }));

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
    fetchAssignments,
    fetchCalendarEventsFromAssignments,
    fetchAnnouncements
};
