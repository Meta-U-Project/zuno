const { PrismaClient } = require('../generated/prisma');
const { getUserPreferenceMap, filterSlotsByPreferences } = require('./studyTimeUtils');

const prisma = new PrismaClient();

async function getEligibleTasks(userId) {
    const now = new Date();

    const tasks = await prisma.task.findMany({
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

    return tasks;
}

async function getPrioritizedTasks(userId) {
    const tasks = await prisma.task.findMany({
        where: {
            userId,
            completed: false,
            deadline: { gt: new Date() },
            requiresStudyBlock: true,
        },
        orderBy: {
            priority: 'desc',
        }
    });

    return tasks;
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

    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
        const startOfDay = new Date(day);
        startOfDay.setHours(9, 0, 0, 0);

        const endOfDay = new Date(day);
        endOfDay.setHours(20, 0, 0, 0);

        let cursor = new Date(startOfDay);

        const eventsToday = existingEvents.filter(ev =>
            ev.start_time >= startOfDay && ev.start_time < endOfDay
        );

        eventsToday.sort((a, b) => a.start_time - b.start_time);

        for (const event of eventsToday) {
            if (cursor < event.start_time) {
                freeSlots.push({
                    start: new Date(cursor),
                    end: new Date(event.start_time),
                    duration: (event.start_time - cursor) / (1000 * 60)
                });
            }
            cursor = new Date(Math.max(cursor, event.end_time));
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
        const availableSlots = await getAvailableStudySlots(userId, startDate, endDate);

        if (availableSlots.length === 0) {
            console.log('No available study slots found within preferred times');
            return [];
        }

        const scheduledBlocks = [];
        const dailyStudyTime = {};
        const DAILY_STUDY_CAP = 120;
        const MIN_BLOCK_SIZE = 30;

        const slotsByDay = {};
        availableSlots.forEach(slot => {
            const dayKey = slot.start.toISOString().split('T')[0];
            if (!slotsByDay[dayKey]) {
                slotsByDay[dayKey] = [];
            }
            slotsByDay[dayKey].push(slot);
        });

        const sortedTasks = tasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        const taskQueue = [];
        sortedTasks.forEach(task => {
            const requiredStudyTime = task.studyTime || 60;
            taskQueue.push({
                originalTask: task,
                remainingTime: requiredStudyTime,
                taskId: task.id,
                priority: task.priority || 0
            });
        });

        const dayKeys = Object.keys(slotsByDay).sort();

        for (const taskPortion of taskQueue) {
            let taskScheduled = false;

            for (const dayKey of dayKeys) {
                const dailyUsed = dailyStudyTime[dayKey] || 0;
                const dailyRemaining = DAILY_STUDY_CAP - dailyUsed;

                if (dailyRemaining < MIN_BLOCK_SIZE) {
                    continue;
                }

                const slotsForDay = slotsByDay[dayKey];

                for (let i = 0; i < slotsForDay.length; i++) {
                    const slot = slotsForDay[i];

                    if (!slot || slot.duration < MIN_BLOCK_SIZE) {
                        continue;
                    }

                    const maxTimeForSlot = Math.min(
                        slot.duration,
                        taskPortion.remainingTime,
                        dailyRemaining
                    );

                    if (maxTimeForSlot >= MIN_BLOCK_SIZE) {
                        const studyBlock = {
                            taskId: taskPortion.taskId,
                            userId: userId,
                            start_time: slot.start,
                            end_time: new Date(slot.start.getTime() + (maxTimeForSlot * 60 * 1000)),
                            type: 'TASK_BLOCK',
                            is_group_event: false,
                            location: 'Study Session',
                            createdById: userId
                        };

                        scheduledBlocks.push(studyBlock);

                        dailyStudyTime[dayKey] = (dailyStudyTime[dayKey] || 0) + maxTimeForSlot;
                        taskPortion.remainingTime -= maxTimeForSlot;

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

                        if (taskPortion.remainingTime <= 0) {
                            taskScheduled = true;
                            break;
                        }

                        if (dailyStudyTime[dayKey] >= DAILY_STUDY_CAP) {
                            break;
                        }
                    }
                }

                if (taskScheduled) {
                    break;
                }
            }

            if (!taskScheduled && taskPortion.remainingTime > 0) {
                console.log(`Could not fully schedule task ${taskPortion.originalTask.title}. Remaining time: ${taskPortion.remainingTime} minutes`);
            }
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
