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
            source: 'CANVAS',
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

    const momentumScore = calculateEMA(completionRates, 0.4);

    if (!momentumScore || isNaN(momentumScore)) {
        momentumScore = percent; // fallback if no history
    }


    return {
        percent,
        momentumScore,
    };
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
            startTime: {
                gte: startOfWeek,
                lt: endOfWeek,
            },
        },
    });

    const total = notes.length + studyBlocks.length;
    const completedStudyBlocks = studyBlocks.filter((b) => b.completed).length;
    const completed = notes.length + completedStudyBlocks;

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
        momentumScore: percent, // fallback for now, similar to canvas
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
            startTime: {
                gte: startOfWeek,
                lt: endOfWeek,
            },
        },
    });

    const total = studyBlocks.length;
    const completed = studyBlocks.filter((b) => b.completed).length;

    const adherenceScore = total === 0 ? 100 : Math.round((completed / total) * 100);

    return {
        scheduled: total,
        completed,
        adherenceScore,
    };
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
        source: 'CANVAS',
        deadline: {
            gte: today,
            lt: threeDaysFromNow,
        },
        },
    });

    const tasksNext7Days = await prisma.task.findMany({
        where: {
            userId,
            source: 'CANVAS',
            deadline: {
                gte: today,
                lt: sevenDaysFromNow,
            },
        },
    });

    const tasks3 = tasksNext3Days.length;
    const tasks7 = tasksNext7Days.length;

    const density = tasks7 === 0 ? 0 : tasks3 / tasks7;
    const stressScore = Math.round(100 - density * 100);

    return {
        stressScore,
        density,
        tasksNext3: tasks3,
        tasksNext7: tasks7,
    };
}

async function getZunoScoreTrend(userId) {
    const history = await prisma.zunoScore.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: 7,
    });

    if (history.length < 2) {
        return {
            stabilityScore: 100,
            slope: 0,
        };
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

    return {
        stabilityScore,
        slope,
    };
}


module.exports = {
    calculateZunoScoreForUser,
};
