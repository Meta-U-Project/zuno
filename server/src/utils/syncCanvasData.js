const getCanvasApiClient = require('./canvasApi');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function syncCanvasData(user) {
    const canvas = getCanvasApiClient(user.canvasAccessToken, user.canvasDomain);
    const userId = user.id;

    try {
        // Sync courses
        const coursesRes = await canvas.get('/courses?per_page=100');
        const courseData = coursesRes.data;

        for (const course of courseData) {
            await prisma.course.upsert({
                where: { id: course.id.toString() },
                update: {
                    course_name: course.name || 'Untitled',
                    course_code: course.course_code || 'N/A',
                    instructor_name: 'TBD',
                    term: course.term || 'N/A',
                },
                create: {
                    id: course.id.toString(),
                    userId,
                    course_name: course.name || 'Untitled',
                    course_code: course.course_code || 'N/A',
                    instructor_name: 'TBD',
                    term: course.term || 'N/A',
                }
            });
        }

        // Sync assignments and related calendar events
        for (const course of courseData) {
            const assignmentsRes = await canvas.get(`/courses/${course.id}/assignments?per_page=100`);
            const assignments = assignmentsRes.data;

            for (const assignment of assignments) {
                const task = await prisma.task.upsert({
                    where: { id: assignment.id.toString() },
                    update: {
                        title: assignment.name,
                        description: assignment.description || '',
                        deadline: new Date(assignment.due_at),
                    },
                    create: {
                        id: assignment.id.toString(),
                        userId,
                        courseId: course.id.toString(),
                        title: assignment.name,
                        type: 'ASSIGNMENT',
                        description: assignment.description || '',
                        priority: 'MEDIUM',
                        deadline: new Date(assignment.due_at),
                    }
                });

                if (assignment.due_at) {
                    await prisma.calendarEvent.upsert({
                        where: { taskId: task.id },
                        update: {
                            start_time: new Date(assignment.due_at),
                            end_time: new Date(assignment.due_at),
                        },
                        create: {
                            userId,
                            taskId: task.id,
                            start_time: new Date(assignment.due_at),
                            end_time: new Date(assignment.due_at),
                            type: 'TASK_BLOCK',
                            is_group_event: false,
                            location: 'Canvas',
                            createdById: userId,
                        }
                    });
                }
            }
        }

        // Sync announcements
        for (const course of courseData) {
            const annRes = await canvas.get(`/courses/${course.id}/discussion_topics?only_announcements=true&per_page=100`);
            const announcements = annRes.data;

            for (const announcement of announcements) {
                await prisma.announcement.upsert({
                    where: { id: announcement.id.toString() },
                    update: { title: announcement.title },
                    create: {
                        id: announcement.id.toString(),
                        userId,
                        courseId: course.id.toString(),
                        title: announcement.title,
                        message: announcement.message,
                    }
                });
            }
        }

        console.log(`Canvas sync complete for user: ${user.email}`);
    } catch (err) {
        console.error('Canvas sync error:', err.message);
    }
}

module.exports = { syncCanvasData };
