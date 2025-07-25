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
        if (!user.canvasUserId) {
            try {
                const profileResponse = await canvas.get('/users/self');
                const canvasUserId = profileResponse.data.id?.toString();

                if (canvasUserId) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: { canvasUserId }
                    });
                    user.canvasUserId = canvasUserId;
                }
            } catch (profileErr) {
                console.error('Error fetching Canvas user profile:', profileErr.message);
            }
        }
        const coursesRes = await canvas.get('/courses?per_page=100');
        const courseData = coursesRes.data;

        for (const course of courseData) {
            let instructorName = 'TBD';
            try {
                const teachersRes = await canvas.get(`/courses/${course.id}/users?enrollment_type=teacher`);
                const teachers = teachersRes.data;

                if (teachers && teachers.length > 0) {
                    instructorName = teachers[0].name || teachers[0].display_name || 'TBD';
                }
            } catch (err) {
                console.warn(`Could not fetch teachers for course ${course.id}: ${err.message}`);
            }

            let currentScore = null;
            let currentGrade = null;

            if (user.canvasUserId) {
                try {
                    const gradeRes = await canvas.get(`/courses/${course.id}/enrollments?user_id=${user.canvasUserId}`);
                    const enrollments = gradeRes.data;

                    if (enrollments && enrollments.length > 0) {
                        const enrollment = enrollments[0];
                        currentScore = enrollment.grades?.current_score;
                        currentGrade = enrollment.grades?.current_grade;
                    }
                } catch (err) {
                    console.warn(`Could not fetch enrollment data for course ${course.id}: ${err.message}`);
                }
            }

            const canvasUrl = `https://${user.canvasDomain}/courses/${course.id}`;

            await prisma.course.upsert({
                where: { id: course.id.toString() },
                update: {
                    course_name: course.name || 'Untitled',
                    course_code: course.course_code || 'N/A',
                    instructor_name: instructorName,
                    term: course.term || 'N/A',
                    current_score: currentScore,
                    current_grade: currentGrade,
                    canvas_url: canvasUrl,
                },
                create: {
                    id: course.id.toString(),
                    userId,
                    course_name: course.name || 'Untitled',
                    course_code: course.course_code || 'N/A',
                    instructor_name: instructorName,
                    term: course.term || 'N/A',
                    current_score: currentScore,
                    current_grade: currentGrade,
                    canvas_url: canvasUrl,
                }
            });
        }

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

                let isSubmitted = false;
                if (user.canvasUserId) {
                    try {
                        const submissionRes = await canvas.get(`/courses/${course.id}/assignments/${assignment.id}/submissions/${user.canvasUserId}`);
                        const submission = submissionRes.data;
                        isSubmitted = submission.workflow_state === 'submitted' || submission.workflow_state === 'graded';
                    } catch (err) {
                        console.warn(`Could not fetch submission status for assignment ${assignment.id}: ${err.message}`);
                    }
                }

                const canvasNote = "\n\n<p><strong>Note:</strong> This task was imported from Canvas. Please view Canvas for more details and submission options.</p>";
                const assignmentDescription = assignment.description || '';
                const descriptionWithNote = assignmentDescription + canvasNote;

                await prisma.task.upsert({
                    where: { id: assignment.id.toString() },
                    update: {
                        title: assignment.name,
                        description: descriptionWithNote,
                        deadline: new Date(assignment.due_at),
                        source: "canvas",
                        completed: isSubmitted,
                    },
                    create: {
                        id: assignment.id.toString(),
                        userId,
                        courseId: course.id.toString(),
                        title: assignment.name,
                        type: type,
                        description: descriptionWithNote,
                        priority: priorityScore,
                        studyTime,
                        requiresStudyBlock: true,
                        deadline: new Date(assignment.due_at),
                        source: "canvas",
                        completed: isSubmitted,
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

        for (const course of courseData) {
            const discussionsRes = await canvas.get(`/courses/${course.id}/discussion_topics?per_page=100`);
            const discussions = discussionsRes.data;

            for (const discussion of discussions) {
                    const isGraded = discussion.assignment && discussion.assignment.points_possible > 0;
                    const hasDueDate = discussion.assignment && discussion.assignment.due_at;

                    if (isGraded || hasDueDate) {

                        const priorityScore = calculatePriorityScore(discussion)
                        const studyTime = estimateStudyTime(discussion)

                        const discussionTask = discussion.assignment;
                        let isSubmitted = false;
                        if (user.canvasUserId && discussionTask) {
                            try {
                                const submissionRes = await canvas.get(`/courses/${course.id}/assignments/${discussionTask.id}/submissions/${user.canvasUserId}`);
                                const submission = submissionRes.data;
                                isSubmitted = submission.workflow_state === 'submitted' || submission.workflow_state === 'graded';
                            } catch (err) {
                                console.warn(`Could not fetch submission status for discussion ${discussion.id}: ${err.message}`);
                            }
                        }

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
                            const canvasNote = "\n\n<p><strong>Note:</strong> This discussion was imported from Canvas. Please view Canvas for more details and to participate in the discussion.</p>";
                            const discussionMessage = discussion.message || '';
                            const messageWithNote = discussionMessage + canvasNote;

                            task = await prisma.task.update({
                                where: { id: existingTask.id },
                                data: {
                                    title: discussion.title,
                                    description: messageWithNote,
                                    deadline: discussionTask.due_at ? new Date(discussionTask.due_at) : null,
                                    source: "canvas",
                                    completed: isSubmitted
                                }
                            });
                        } else {
                            const canvasNote = "\n\n<p><strong>Note:</strong> This discussion was imported from Canvas. Please view Canvas for more details and to participate in the discussion.</p>";
                            const discussionMessage = discussion.message || '';
                            const messageWithNote = discussionMessage + canvasNote;

                            task = await prisma.task.create({
                                data: {
                                    id: discussion.id.toString(),
                                    userId,
                                    courseId: course.id.toString(),
                                    title: discussion.title,
                                    type: 'DISCUSSION',
                                    description: messageWithNote,
                                    priority: priorityScore,
                                    studyTime,
                                    requiresStudyBlock: true,
                                    deadline: discussionTask.due_at ? new Date(discussionTask.due_at) : null,
                                    source: "canvas",
                                    completed: isSubmitted
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


        for (const course of courseData) {
            const annRes = await canvas.get(`/courses/${course.id}/discussion_topics?only_announcements=true&per_page=100`);
            const announcements = annRes.data;

            for (const announcement of announcements) {
                await prisma.announcement.upsert({
                    where: { id: announcement.id.toString() },
                    update: {
                        title: announcement.title,
                        message: announcement.message,
                        postedAt: announcement.posted_at ? new Date(announcement.posted_at) : new Date(),
                    },
                    create: {
                        id: announcement.id.toString(),
                        userId,
                        courseId: course.id.toString(),
                        courseName: course.name || 'Unknown Course',
                        title: announcement.title,
                        message: announcement.message,
                        postedAt: announcement.posted_at ? new Date(announcement.posted_at) : new Date(),
                    }
                });
            }
        }
        const lecturesToSync = [];
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
                        const updatedLecture = await prisma.lecture.update({
                            where: { id: existingLecture.id },
                            data: {
                                title: event.summary || `${course.name} Class Session`,
                                description: event.description || '',
                                location: event.location || 'Classroom',
                                start_time: startTime,
                                end_time: endTime
                            }
                        });

                        if (user.googleAccessToken && user.googleCalendarId) {
                            lecturesToSync.push(updatedLecture);
                        }
                    } else {
                        const newLecture = await prisma.lecture.create({
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

                        if (user.googleAccessToken && user.googleCalendarId) {
                            lecturesToSync.push(newLecture);
                        }
                    }
                }
            } catch (err) {
                console.error(`Error syncing ICS for course ${course.name}:`, err.message);
            }
        }
        if (user.googleAccessToken && user.googleCalendarId && lecturesToSync.length > 0) {
            try {
                const googleController = require('../controllers/googleController');

                await googleController.setupZunoCalendar(user.id);

                let successCount = 0;
                let errorCount = 0;

                for (const lecture of lecturesToSync) {
                    try {
                        await googleController.syncLectureToGoogleCalendar(user.id, lecture.id);
                        successCount++;
                    } catch (error) {
                        console.error(`Error syncing lecture ${lecture.id} to Google Calendar:`, error);
                        errorCount++;
                    }
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

            } catch (syncError) {
                console.error(`Error batch syncing lectures to Google Calendar:`, syncError);
            }
        }
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

        await prisma.user.update({
            where: { id: user.id },
            data: { lastCanvasSync: now }
        });
    } catch (err) {
        console.error('Canvas sync error:', err.message);
    }
}

module.exports = { syncCanvasData };
