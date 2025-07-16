const { PrismaClient } = require('../generated/prisma');
const { getUserPreferenceMap, filterSlotsByPreferences } = require('./studyTimeUtils');

const prisma = new PrismaClient();

async function getEligibleTasks(userId) {
    const now = new Date();

    const tasksWithDeadlines = await prisma.task.findMany({
        where: {
            userId,
            completed: false,
            deadline: {
                gte: now,
            },
            requiresStudyBlock: true,
        },
        include: {
            course: true
        },
    });

    const tasksWithoutDeadlines = await prisma.task.findMany({
        where: {
            userId,
            completed: false,
            deadline: null,
            requiresStudyBlock: true,
        },
        include: {
            course: true
        },
    });

    const allEligibleTasks = [...tasksWithDeadlines, ...tasksWithoutDeadlines];

    console.log(`Found ${tasksWithDeadlines.length} tasks with deadlines and ${tasksWithoutDeadlines.length} tasks without deadlines`);

    return allEligibleTasks;
}

async function getPrioritizedTasks(userId) {
    const allTasks = await getEligibleTasks(userId);

    const sortedTasks = allTasks.sort((a, b) => {
        if ((b.priority || 0) !== (a.priority || 0)) {
            return (b.priority || 0) - (a.priority || 0);
        }

        if (a.deadline && b.deadline) {
            return new Date(a.deadline) - new Date(b.deadline);
        } else if (a.deadline) {
            return -1;
        } else if (b.deadline) {
            return 1;
        }

        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    return sortedTasks;
}

async function getExistingEvents(userId, startDate = new Date(), endDate = null) {
    const whereClause = {
        userId,
        start_time: { gte: startDate }
    };

    if (endDate) {
        whereClause.start_time.lte = endDate;
    }

    const existingEvents = await prisma.calendarEvent.findMany({
        where: whereClause,
        orderBy: { start_time: 'asc' }
    });

    return existingEvents;
}

function getFreeTimeSlots(existingEvents, startDate, endDate) {
    const freeSlots = [];

    if (!(endDate instanceof Date)) {
        endDate = new Date(endDate);
    }

    for (let day = new Date(startDate); day.getTime() <= endDate.getTime(); day.setDate(day.getDate() + 1)) {
        const startOfDay = new Date(day);
        startOfDay.setHours(9, 0, 0, 0);

        const endOfDay = new Date(day);
        endOfDay.setHours(20, 0, 0, 0);

        let cursor = new Date(startOfDay);

        const eventsToday = existingEvents.filter(ev => {
            const eventStart = ev.start_time instanceof Date ? ev.start_time : new Date(ev.start_time);

            return eventStart >= startOfDay && eventStart < endOfDay;
        });

        eventsToday.sort((a, b) => a.start_time - b.start_time);

        for (const event of eventsToday) {
            if (cursor < event.start_time) {
                freeSlots.push({
                    start: new Date(cursor),
                    end: new Date(event.start_time),
                    duration: (event.start_time - cursor) / (1000 * 60)
                });
            }
            const eventEndTime = event.end_time instanceof Date ? event.end_time : new Date(event.end_time);
            cursor = new Date(Math.max(cursor.getTime(), eventEndTime.getTime()));
        }

        if (cursor < endOfDay) {
            freeSlots.push({
                start: new Date(cursor),
                end: new Date(endOfDay),
                duration: (endOfDay - cursor) / (1000 * 60)
            });

        }
    }

    return freeSlots;
}

async function getAvailableStudySlots(userId, startDate, endDate) {
    try {
        const existingEvents = await getExistingEvents(userId, startDate, endDate);

        const freeSlots = getFreeTimeSlots(existingEvents, startDate, endDate);

        const preferenceMap = await getUserPreferenceMap(userId, prisma);

        const availableSlots = filterSlotsByPreferences(freeSlots, preferenceMap);

        return availableSlots;
    } catch (error) {
        console.error('Error getting available study slots:', error);
        throw error;
    }
}

async function scheduleStudyBlocks(userId, tasks, startDate, endDate) {
    try {
        console.log(`Getting available study slots for user: ${userId}`);
        console.log(`Date range: ${startDate} to ${endDate}`);

        const existingEvents = await getExistingEvents(userId, startDate, endDate);
        console.log(`Found ${existingEvents.length} existing events`);

        const freeSlots = getFreeTimeSlots(existingEvents, startDate, endDate);
        console.log(`Found ${freeSlots.length} free time slots`);

        if (freeSlots.length > 0) {
            console.log('Sample free slots:', freeSlots.slice(0, 3));
        }

        const preferenceMap = await getUserPreferenceMap(userId, prisma);
        console.log('User preference map:', preferenceMap);

        let availableSlots = filterSlotsByPreferences(freeSlots, preferenceMap);
        console.log(`After filtering by preferences: ${availableSlots.length} available slots`);

        if (availableSlots.length > 0) {
            console.log('Sample available slots:', availableSlots.slice(0, 3));
        }

        if (availableSlots.length === 0) {
            console.log('No slots match user preferences. Falling back to all available free slots');
            availableSlots = freeSlots.filter(slot => slot.duration >= 15);

            if (availableSlots.length === 0) {
                console.log('No available study slots found');
                return [];
            }
        }

        const scheduledBlocks = [];
        const dailyStudyTime = {};
        const DAILY_STUDY_CAP = 180;
        const MIN_BLOCK_SIZE = 15;

        const slotsByDay = {};
        availableSlots.forEach(slot => {
            const dayKey = slot.start.toISOString().split('T')[0];
            if (!slotsByDay[dayKey]) {
                slotsByDay[dayKey] = [];
            }
            slotsByDay[dayKey].push(slot);
        });

        const sortedTasks = tasks.sort((a, b) => {
            const deadlineA = a.deadline ? new Date(a.deadline) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // Default to 2 weeks from now
            const deadlineB = b.deadline ? new Date(b.deadline) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
            const now = new Date();

            const daysToDeadlineA = Math.max(0.5, (deadlineA - now) / (1000 * 60 * 60 * 24));
            const daysToDeadlineB = Math.max(0.5, (deadlineB - now) / (1000 * 60 * 60 * 24));

            const urgencyScoreA = 1 / daysToDeadlineA;
            const urgencyScoreB = 1 / daysToDeadlineB;

            const priorityScoreA = a.priority || 0;
            const priorityScoreB = b.priority || 0;

            const scoreA = (urgencyScoreA * 0.7) + (priorityScoreA * 0.3);
            const scoreB = (urgencyScoreB * 0.7) + (priorityScoreB * 0.3);

            return scoreB - scoreA;
        });

        const taskQueue = [];
        sortedTasks.forEach(task => {
            const requiredStudyTime = typeof task.studyTime === 'number' && task.studyTime > 0
                ? Math.max(MIN_BLOCK_SIZE, task.studyTime * 60)
                : 60;

            taskQueue.push({
                originalTask: task,
                remainingTime: requiredStudyTime,
                taskId: task.id,
                priority: task.priority || 0,
                deadline: task.deadline ? new Date(task.deadline) : null,
                title: task.title || 'Untitled Task'
            });
        });

        console.log('Task queue created with', taskQueue.length, 'tasks');
        taskQueue.forEach((task, index) => {
            console.log(`Task ${index + 1}: ${task.title}, Priority: ${task.priority}, Study Time: ${task.remainingTime} minutes`);
        });

        const dayKeys = Object.keys(slotsByDay).sort();

        let taskIndex = 0;
        let passCount = 0;
        const MAX_PASSES = 3;

        while (taskIndex < taskQueue.length && passCount < MAX_PASSES) {
            const taskPortion = taskQueue[taskIndex];

            if (taskPortion.remainingTime <= 0) {
                taskIndex++;
                continue;
            }

            let madeProgress = false;

            for (const dayKey of dayKeys) {
                const dailyUsed = dailyStudyTime[dayKey] || 0;
                const dailyRemaining = DAILY_STUDY_CAP - dailyUsed;

                if (dailyRemaining < MIN_BLOCK_SIZE) {
                    continue;
                }

                const slotsForDay = slotsByDay[dayKey];
                if (!slotsForDay || slotsForDay.length === 0) {
                    continue;
                }

                for (let i = 0; i < slotsForDay.length; i++) {
                    const slot = slotsForDay[i];

                    if (!slot || slot.duration < MIN_BLOCK_SIZE) {
                        continue;
                    }

                    let maxTimeForSlot = Math.min(
                        slot.duration,
                        taskPortion.remainingTime,
                        dailyRemaining
                    );

                    if (taskPortion.remainingTime >= 30 && maxTimeForSlot >= 30) {
                        if (maxTimeForSlot > 60 && taskPortion.remainingTime > 60) {
                            maxTimeForSlot = 60;
                        } else {
                            maxTimeForSlot = Math.max(30, maxTimeForSlot);
                        }
                    }

                    const isBeforeDeadline = !taskPortion.deadline ||
                        new Date(slot.start) < new Date(taskPortion.deadline);

                    if (!isBeforeDeadline) {
                        continue;
                    }

                    if (maxTimeForSlot >= MIN_BLOCK_SIZE) {
                        const startTime = new Date(slot.start);
                        const endTime = new Date(startTime.getTime() + (maxTimeForSlot * 60 * 1000));

                        if (taskPortion.deadline && endTime > new Date(taskPortion.deadline)) {
                            endTime.setTime(new Date(taskPortion.deadline).getTime());
                            maxTimeForSlot = (endTime - startTime) / (1000 * 60);

                            if (maxTimeForSlot < MIN_BLOCK_SIZE) {
                                continue;
                            }
                        }

                        const studyBlock = {
                            taskId: taskPortion.taskId,
                            userId: userId,
                            start_time: startTime,
                            end_time: endTime,
                            type: 'TASK_BLOCK',
                            is_group_event: false,
                            location: 'Study Session',
                            createdById: userId
                        };

                        console.log(`Scheduling block for task "${taskPortion.title}": ${startTime.toLocaleString()} - ${endTime.toLocaleString()} (${maxTimeForSlot} minutes)`);
                        console.log(`  Remaining time before: ${taskPortion.remainingTime} minutes`);

                        scheduledBlocks.push(studyBlock);

                        dailyStudyTime[dayKey] = (dailyStudyTime[dayKey] || 0) + maxTimeForSlot;
                        taskPortion.remainingTime -= maxTimeForSlot;

                        console.log(`  Remaining time after: ${taskPortion.remainingTime} minutes`);

                        const remainingSlotTime = slot.duration - maxTimeForSlot;
                        if (remainingSlotTime >= MIN_BLOCK_SIZE) {
                            slotsForDay[i] = {
                                ...slot,
                                start: new Date(slot.start.getTime() + (maxTimeForSlot * 60 * 1000)),
                                duration: remainingSlotTime
                            };
                        } else {
                            slotsForDay.splice(i, 1);
                            i--;
                        }

                        madeProgress = true;

                        if (taskPortion.remainingTime <= 0) {
                            break;
                        }

                        if (dailyStudyTime[dayKey] >= DAILY_STUDY_CAP) {
                            break;
                        }
                    }
                }

                if (taskPortion.remainingTime <= 0) {
                    break;
                }
            }

            if (madeProgress && taskPortion.remainingTime > 0 && taskIndex < taskQueue.length - 1) {
                taskIndex++;
            }
            else if (!madeProgress) {
                const taskName = taskPortion.originalTask.title || taskPortion.originalTask.name || 'Unknown Task';
                console.log(`Could not schedule more time for task ${taskName}. Remaining time: ${taskPortion.remainingTime} minutes`);
                taskIndex++;
            }
            else if (taskPortion.remainingTime <= 0 || !madeProgress) {
                taskIndex++;
            }

            if (taskIndex >= taskQueue.length) {
                const unfinishedTasks = taskQueue.filter(task => task.remainingTime > 0);
                if (unfinishedTasks.length > 0 && passCount < MAX_PASSES - 1) {
                    console.log(`Starting pass ${passCount + 2} for ${unfinishedTasks.length} unfinished tasks`);
                    taskIndex = 0;
                    passCount++;
                } else {
                    break;
                }
            }
        }

        const unscheduledTasks = taskQueue.filter(task => task.remainingTime > 0);
        if (unscheduledTasks.length > 0) {
            console.log(`${unscheduledTasks.length} tasks could not be fully scheduled:`);
            unscheduledTasks.forEach(task => {
                console.log(`  - ${task.title}: ${task.remainingTime} minutes remaining`);
            });
        }

        console.log('Daily study time scheduled:');
        Object.entries(dailyStudyTime).forEach(([day, minutes]) => {
            console.log(`   ${day}: ${minutes} minutes (${(minutes/60).toFixed(1)} hours)`);
        });

        return scheduledBlocks;
    } catch (error) {
        console.error('Error scheduling study blocks:', error);
        throw error;
    }
}

async function saveStudyBlocks(studyBlocks) {
    try {
        const createdEvents = await Promise.all(
            studyBlocks.map(block =>
                prisma.calendarEvent.create({
                    data: block
                })
            )
        );

        console.log(`Created ${createdEvents.length} study blocks`);
        return createdEvents;
    } catch (error) {
        console.error('Error saving study blocks:', error);
        throw error;
    }
}

module.exports = {
    getEligibleTasks,
    getPrioritizedTasks,
    getExistingEvents,
    getFreeTimeSlots,
    getAvailableStudySlots,
    scheduleStudyBlocks,
    saveStudyBlocks
};
