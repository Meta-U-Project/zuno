const cron = require('node-cron');
const { PrismaClient } = require('../generated/prisma');
const { calculateZunoScoreForUser } = require('../utils/zunoScoreEngine');

const prisma = new PrismaClient();

const zunoScoreScheduler = () => {
    cron.schedule('0 2 * * *', async () => {
        try {
            const users = await prisma.user.findMany({ select: { id: true } });

            for (const user of users) {
                try {
                    await calculateZunoScoreForUser(user.id);
                } catch (userError) {
                    console.error(`Error calculating score for user ${user.id}:`, userError);
                }
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    });
};

module.exports = zunoScoreScheduler;
