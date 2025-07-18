const getCanvasApiClient = require('./canvasApi');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const axios = require('axios');
const ical = require('ical');
const { calculatePriorityScore, estimateStudyTime } = require('./priorityUtils')

async function syncCanvasData(user) {
    if (!user.canvasAccessToken || !user.canvasDomain) {
        console.warn('No Canvas access token or domain for user:', user?.email);
        return;
    }

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
                if (assignment.submission_types.includes("discussion_topic")) {
                    continue;
                }

                let type;
                if (assignment.is_quiz_assignment) {
                    type = 'QUIZ';
                } else {
                    type = 'ASSIGNMENT';
                }

                const priorityScore = calculatePriorityScore(assignment)
                const studyTime = estimateStudyTime(assignment)

                await prisma.task.upsert({
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
                        type: type,
                        description: assignment.description || '',
                        priority: priorityScore,
                        studyTime,
                        requiresStudyBlock: true,
                        deadline: new Date(assignment.due_at),
                    }

                });

                if (assignment.due_at) {
                    const existingEvent = await prisma.calendarEvent.findFirst({
                        where: {
                            userId: user.id,
                            taskId: String(assignment.id),
                        }
                    });

                    if (existingEvent) {
                        await prisma.calendarEvent.update({
                            where: { id: existingEvent.id },
                            data: {
                                start_time: new Date(assignment.due_at),
                                end_time: new Date(assignment.due_at),
                            }
                            });
                        } else {
                            await prisma.calendarEvent.create({
                                data: {
                                    userId: user.id,
                                    taskId: String(assignment.id),
                                    start_time: new Date(assignment.due_at),
                                    end_time: new Date(assignment.due_at),
                                    type: 'TASK_BLOCK',
                                    is_group_event: false,
                                    location: 'Canvas',
                                    createdById: user.id
                                }
                            });
                        }
                }
            }
        }

        // Sync Discussions
        for (const course of courseData) {
            const discussionsRes = await canvas.get(`/courses/${course.id}/discussion_topics?per_page=100`);
            const discussions = discussionsRes.data;

            for (const discussion of discussions) {
                    const isGraded = discussion.assignment && discussion.assignment.points_possible > 0; // Fixed: > 0 instead of >= 0
                    const hasDueDate = discussion.assignment && discussion.assignment.due_at;

                    if (isGraded || hasDueDate) {

                        const priorityScore = calculatePriorityScore(discussion)
                        const studyTime = estimateStudyTime(discussion)

                        const discussionTask = discussion.assignment;

                        const existingTask = await prisma.task.findFirst({
                            where: {
                                userId: userId,
                                courseId: course.id.toString(),
                                title: discussion.title,
                                type: 'DISCUSSION'
                            }
                        });

                        let task;
                        if (existingTask) {
                            task = await prisma.task.update({
                                where: { id: existingTask.id },
                                data: {
                                    title: discussion.title,
                                    description: discussion.message || '',
                                    deadline: discussionTask.due_at ? new Date(discussionTask.due_at) : null,
                                }
                            });
                        } else {
                            task = await prisma.task.create({
                                data: {
                                    id: discussion.id.toString(),
                                    userId,
                                    courseId: course.id.toString(),
                                    title: discussion.title,
                                    type: 'DISCUSSION',
                                    description: discussion.message || '',
                                    priority: priorityScore,
                                    studyTime,
                                    requiresStudyBlock: true,
                                    deadline: discussionTask.due_at ? new Date(discussionTask.due_at) : null,
                                }
                            });
                        }

                        if (discussionTask.due_at) {
                            const existingEvent = await prisma.calendarEvent.findFirst({
                                where: {
                                    userId: user.id,
                                    taskId: task.id,
                                }
                            });

                            if (existingEvent) {
                                await prisma.calendarEvent.update({
                                    where: { id: existingEvent.id },
                                    data: {
                                        start_time: new Date(discussionTask.due_at),
                                        end_time: new Date(discussionTask.due_at),
                                    }
                                });
                            } else {
                                await prisma.calendarEvent.create({
                                    data: {
                                        userId: user.id,
                                        taskId: task.id,
                                        start_time: new Date(discussionTask.due_at),
                                        end_time: new Date(discussionTask.due_at),
                                        type: 'TASK_BLOCK',
                                        is_group_event: false,
                                        location: 'Canvas',
                                        createdById: user.id
                                    }
                                });
                            }}}}}


        // Sync announcements
        for (const course of courseData) {
            const annRes = await canvas.get(`/courses/${course.id}/discussion_topics?only_announcements=true&per_page=100`);
            const announcements = annRes.data;

            for (const announcement of announcements) {
                await prisma.announcement.upsert({
                    where: { id: announcement.id.toString() },
                    update: {
                        title: announcement.title,
                        message: announcement.message,
                        postedAt: new Date(announcement.posted_at),
                    },
                    create: {
                        id: announcement.id.toString(),
                        userId,
                        courseId: course.id.toString(),
                        title: announcement.title,
                        message: announcement.message,
                        courseName: course.name,
                        postedAt: new Date(announcement.posted_at),
                    }
                });
            }
        }
        for (const course of courseData) {
            try {
                const icsUrl = course.calendar?.ics;
                if (!icsUrl) {
                    console.warn(`No ICS URL found for course: ${course.name}`);
                    continue;
                }

                const response = await axios.get(icsUrl);
                const parsedEvents = ical.parseICS(response.data);

                const lectureEvents = Object.values(parsedEvents).filter(ev =>
                    ev.type === 'VEVENT' &&
                    typeof ev.uid === 'string' &&
                    !ev.uid.startsWith('event-assignment-')
                );


                for (const event of lectureEvents) {
                    const startTime = new Date(event.start);
                    const endTime = new Date(event.end || startTime.getTime() + 60 * 60 * 1000);

                    const existingLecture = await prisma.lecture.findFirst({
                        where: {
                            userId: user.id,
                            courseId: course.id.toString(),
                            ical_uid: event.uid
                        }
                    });

                    if (existingLecture) {
                        // Update existing lecture
                        await prisma.lecture.update({
                            where: { id: existingLecture.id },
                            data: {
                                title: event.summary || `${course.name} Class Session`,
                                description: event.description || '',
                                location: event.location || 'Classroom',
                                start_time: startTime,
                                end_time: endTime
                            }
                        });
                    } else {
                        // Create new lecture
                        await prisma.lecture.create({
                            data: {
                                userId: user.id,
                                courseId: course.id.toString(),
                                title: event.summary || `${course.name} Class Session`,
                                description: event.description || '',
                                location: event.location || 'Classroom',
                                start_time: startTime,
                                end_time: endTime,
                                ical_uid: event.uid
                            }
                        });
                    }
                }
            } catch (err) {
                console.error(`Error syncing ICS for course ${course.name}:`, err.message);
            }
        }


        // Sync analytics
        const tasks = await prisma.task.findMany({
            where: { userId: user.id }
        });
        const tasksCompleted = tasks.filter(task => task.completed).length;
        const now = new Date();

        await prisma.analytics.upsert({
            where: { userId: user.id },
            update: {
                tasks_completed: tasksCompleted,
                last_active: now
            },
            create: {
                userId: user.id,
                tasks_completed: tasksCompleted,
                last_active: now,
                total_study_hours: 0,
                engagement_score: 0
            }
        });
    } catch (err) {
        console.error('Canvas sync error:', err.message);
    }
}

module.exports = { syncCanvasData };
