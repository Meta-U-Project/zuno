const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const { calculateEMA, calculateRegressionSlope } = require('./zunoScoreMath');

async function calculateZunoScoreForUser(userId) {
    const canvasStats = await getCanvasCompletion(userId);
    const zunoStats = await getZunoTaskCompletion(userId);
    const studyStats = await getStudyAdherence(userId);
    const taskDensity = await getTaskDensityStress(userId);
    const trendScore = await getZunoScoreTrend(userId);

    const zunoScore =
        0.4 * canvasStats.momentumScore +
        0.3 * trendScore.stabilityScore +
        0.2 * studyStats.adherenceScore +
        0.1 * taskDensity.stressScore;

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

module.exports = {
    calculateZunoScoreForUser,
};
