const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const { calculateEMA, calculateRegressionSlope } = require('./zunoScoreMath');

async function calculateZunoScoreForUser(userId) {
    const canvasStats = await getCanvasCompletion(userId);
    const zunoStats = await getZunoTaskCompletion(userId);
    const studyStats = await getStudyAdherence(userId);
    const taskDensity = await getTaskDensityStress(userId);
    const trendScore = await getZunoScoreTrend(userId);

    const calculatedScore =
        0.4 * canvasStats.momentumScore +
        0.3 * trendScore.stabilityScore +
        0.2 * studyStats.adherenceScore +
        0.1 * taskDensity.stressScore;

    const historyDepth = await prisma.zunoScore.count({ where: { userId } });
    const trustFactor = Math.min(historyDepth / 7, 1);
    const fallbackScore = canvasStats.percent;

    const zunoScore = Math.round(
        trustFactor * calculatedScore + (1 - trustFactor) * fallbackScore
    );

    await storeTaskCompletionHistory(userId, canvasStats, zunoStats);

    await prisma.zunoScore.create({
        data: {
            userId,
            score: zunoScore,
            canvasCompletion: canvasStats.percent,
            zunoTaskCompletion: zunoStats.percent,
            studyAdherence: studyStats.adherenceScore,
            taskDensityStress: taskDensity.stressScore,
        },
    });

    return zunoScore;
}

async function getCanvasCompletion(userId) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const tasksThisWeek = await prisma.task.findMany({
        where: {
            userId,
            source: 'canvas',
            deadline: {
                gte: startOfWeek,
                lt: endOfWeek,
            },
        },
    });

    const total = tasksThisWeek.length;
    const completed = tasksThisWeek.filter((task) => task.completed).length;
    const percent = total === 0 ? 100 : Math.round((completed / total) * 100);

    const history = await prisma.taskCompletionHistory.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
        take: 7,
    });

    const completionRates = history.map((h) => {
        const completed = h.canvasCompleted || 0;
        const total = h.canvasTotal || 0;
        return total === 0 ? 100 : (completed / total) * 100;
    });

    let momentumScore = calculateEMA(completionRates, 0.4);
    if (!momentumScore || isNaN(momentumScore)) {
        momentumScore = percent;
    }

    return { percent, momentumScore };
}

async function getZunoTaskCompletion(userId) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const endOfWeek = new Date(today);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const notes = await prisma.note.findMany({
        where: {
            userId,
            createdAt: {
                gte: startOfWeek,
                lt: endOfWeek,
            },
        },
    });

    const studyBlocks = await prisma.calendarEvent.findMany({
        where: {
            userId,
            type: 'TASK_BLOCK',
            location: 'Study Session',
            start_time: {
                gte: startOfWeek,
                lt: endOfWeek,
            },
        },
    });

    const zunoTasks = await prisma.task.findMany({
        where: {
            userId,
            source: {
                equals: 'user',
                mode: 'insensitive',
            },
            deadline: {
                gte: startOfWeek,
                lt: endOfWeek,
            },
        },
    });

    const completedZunoTasks = zunoTasks.filter((task) => task.completed).length;

    const total = notes.length + studyBlocks.length + zunoTasks.length;
    const completed = notes.length + studyBlocks.filter(b => b.completed).length + completedZunoTasks;

    const percent = total === 0 ? 100 : Math.round((completed / total) * 100);

    const history = await prisma.taskCompletionHistory.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
        take: 7,
    });

    const completionRates = history.map((h) => {
        const total = h.zunoTotal || 0;
        const completed = h.zunoCompleted || 0;
        return total === 0 ? 100 : (completed / total) * 100;
    });

    let momentumScore = calculateEMA(completionRates, 0.4);
    if (!momentumScore || isNaN(momentumScore)) {
        momentumScore = percent;
    }

    return {
        percent,
        momentumScore,
    };
}

async function getStudyAdherence(userId) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const studyBlocks = await prisma.calendarEvent.findMany({
        where: {
            userId,
            type: 'TASK_BLOCK',
            location: 'Study Session',
            start_time: {
                gte: startOfWeek,
                lt: endOfWeek,
            },
        },
    });

    const total = studyBlocks.length;
    const completed = studyBlocks.filter((b) => b.completed).length;
    const adherenceScore = total === 0 ? 100 : Math.round((completed / total) * 100);

    return { scheduled: total, completed, adherenceScore };
}

async function getTaskDensityStress(userId) {
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const tasksNext3Days = await prisma.task.findMany({
        where: {
            userId,
            deadline: {
                gte: today,
                lt: threeDaysFromNow,
            },
        },
    });

    const sessionsNext3Days = await prisma.calendarEvent.findMany({
        where: {
            userId,
            type: 'TASK_BLOCK',
            location: 'Study Session',
            start_time: {
                gte: today,
                lt: threeDaysFromNow,
            },
        },
    });

    const tasksNext7Days = await prisma.task.findMany({
        where: {
            userId,
            deadline: {
                gte: today,
                lt: sevenDaysFromNow,
            },
        },
    });

    const sessionsNext7Days = await prisma.calendarEvent.findMany({
        where: {
            userId,
            type: 'TASK_BLOCK',
            location: 'Study Session',
            start_time: {
                gte: today,
                lt: sevenDaysFromNow,
            },
        },
    });

    const tasks3 = tasksNext3Days.length + sessionsNext3Days.length;
    const tasks7 = tasksNext7Days.length + sessionsNext7Days.length;

    const density = tasks7 === 0 ? 0 : tasks3 / tasks7;
    const stressScore = Math.round(100 - density * 100);

    return { stressScore, density, tasksNext3: tasks3, tasksNext7: tasks7 };
}

async function getZunoScoreTrend(userId) {
    const history = await prisma.zunoScore.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: 7,
    });

    if (history.length < 2) {
        return { stabilityScore: 100, slope: 0 };
    }

    const scores = history.map((entry) => entry.score);
    const timestamps = history.map((entry) => new Date(entry.createdAt).getTime());

    const slope = calculateRegressionSlope(scores, timestamps);

    let stabilityScore;
    if (slope >= 0) {
        stabilityScore = 100;
    } else if (slope >= -1.5) {
        stabilityScore = 70;
    } else if (slope >= -3) {
        stabilityScore = 40;
    } else {
        stabilityScore = 20;
    }

    return { stabilityScore, slope };
}


async function storeTaskCompletionHistory(userId) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const canvasTasks = await prisma.task.findMany({
        where: {
            userId,
            source: 'canvas',
            deadline: { gte: startOfWeek, lt: endOfWeek }
        }
    });

    const zunoTasks = await prisma.task.findMany({
        where: {
            userId,
            source: 'user',
            deadline: { gte: startOfWeek, lt: endOfWeek }
        }
    });

    const canvasCompleted = canvasTasks.filter(t => t.completed).length;
    const zunoCompleted = zunoTasks.filter(t => t.completed).length;

    await prisma.taskCompletionHistory.create({
        data: {
            userId,
            date: today,
            canvasTotal: canvasTasks.length,
            canvasCompleted,
            zunoTotal: zunoTasks.length,
            zunoCompleted
        }
    });
}


module.exports = {
    calculateZunoScoreForUser,
};
