const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const getCanvasApiClient = require('../utils/canvasApi');
const { findUserByEmail } = require('../models/userService')

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

        // Check if Google is also connected
        const googleConnected = !!updatedUser.googleAccessToken;

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
        const { email } = req.body;
        const user = await findUserByEmail(email);

        if (!user.canvasAccessToken || !user || !user.canvasDomain) {
            return res.status(400).json({ error: 'User not found or canvas not connected' });
        }

        const canvas = getCanvasApiClient(user.canvasAccessToken, user.canvasDomain);
        const response = await canvas.get('/courses?per_page=100');

        res.status(200).json(response.data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong fetching courses' });
    }
};

const fetchAssignments = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await findUserByEmail(email);

        if (!user || !user.canvasAccessToken || !user.canvasDomain) {
            return res.status(400).json({ error: 'User not found or canvas not connected' });
        }

        const canvas = getCanvasApiClient(user.canvasAccessToken, user.canvasDomain);
        const courses = await canvas.get('/courses?per_page=100');

        const assignments = [];

        for (const course of courses.data) {
            try {
                const courseAssignments = await canvas.get(`/courses/${course.id}/assignments?per_page=100`);
                assignments.push(...courseAssignments.data.map(a => ({
                    ...a,
                    courseId: course.id,
                    courseName: course.name
                })));
            } catch (err) {
                console.warn(`Error fetching assignments for course ${course.id}: ${err.message}`);
            }
        }

        res.status(200).json(assignments);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong fetching assignments' });
    }
};

module.exports = { saveCanvasCredentials, fetchCourses, fetchAssignments };
