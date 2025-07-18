const getCanvasApiClient = require('./canvasApi');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
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

                console.log('Assignment input:', {
                    id: assignment.id,
                    name: assignment.name,
                    due_at: assignment.due_at,
                    points_possible: assignment.points_possible,
                    is_quiz_assignment: assignment.is_quiz_assignment,
                    submission_types: assignment.submission_types
                });


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

            console.log(`Found ${discussions.length} discussions in course ${course.name}`);

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

        // Sync class/lecture times from calendar
        for (const course of courseData) {
            try {
                const calendarRes = await canvas.get(`/courses/${course.id}/calendar_events?per_page=100`);
                const calendarEvents = calendarRes.data;

                console.log(`Found ${calendarEvents.length} calendar events in course ${course.name}`);

                for (const event of calendarEvents) {
                    if (event.context_type === 'Course' && !event.assignment_id) {
                        const dummyTaskId = `class_session_${event.id.toString()}`;

                        const existingTask = await prisma.task.findUnique({
                            where: { id: dummyTaskId }
                        });

                        if (!existingTask) {
                            await prisma.task.create({
                                data: {
                                    id: dummyTaskId,
                                    userId,
                                    courseId: course.id.toString(),
                                    title: event.title || `${course.name} Class Session`,
                                    type: 'MEETING', // Keep as MEETING but don't display in UI
                                    description: event.description || '',
                                    priority: 0,
                                    studyTime: 0,
                                    requiresStudyBlock: false,
                                    deadline: null,
                                    completed: true
                                }
                            });
                        }

                        if (event.start_at) {
                            const existingEvent = await prisma.calendarEvent.findFirst({
                                where: {
                                    userId: user.id,
                                    taskId: dummyTaskId,
                                }
                            });

                            const startTime = new Date(event.start_at);
                            const endTime = event.end_at ? new Date(event.end_at) : new Date(startTime.getTime() + 60 * 60 * 1000); // Default to 1 hour if no end time

                            if (existingEvent) {
                                await prisma.calendarEvent.update({
                                    where: { id: existingEvent.id },
                                    data: {
                                        start_time: startTime,
                                        end_time: endTime,
                                        location: event.location_name || 'Classroom',
                                        type: 'CLASS_SESSION'
                                    }
                                });
                            } else {
                                await prisma.calendarEvent.create({
                                    data: {
                                        userId: user.id,
                                        taskId: dummyTaskId,
                                        start_time: startTime,
                                        end_time: endTime,
                                        type: 'CLASS_SESSION',
                                        is_group_event: false,
                                        location: event.location_name || 'Classroom',
                                        createdById: user.id
                                    }
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`Error syncing calendar events for course ${course.name}:`, err.message);
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

        console.log(`Canvas sync complete for user: ${user.email}`);
    } catch (err) {
        console.error('Canvas sync error:', err.message);
    }
}

module.exports = { syncCanvasData };
