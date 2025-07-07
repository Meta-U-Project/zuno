const cron = require('node-cron');
const { syncCanvasData } = require('../utils/syncCanvasData');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const syncCanvasScheduler = () => {
    cron.schedule('0 * * * *', async () => {
        console.log('Running scheduled Canvas sync...');

        const users = await prisma.user.findMany({
            where: {
                canvasAccessToken: { not: null },
                canvasDomain: { not: null }
            }
        });

        for (const user of users) {
            if (!user?.canvasAccessToken || !user?.canvasDomain) {
                console.warn(`Skipping user with missing credentials: ${user?.email || user?.id || 'unknown user'}`);
            continue;
            }

            try {
                await syncCanvasData(user);
                console.log(`Canvas sync complete for user: ${user.email}`);
            } catch (err) {
                console.error(`Canvas sync error for user ${user.email}:`, err.message);
            }
        }
    });
};

module.exports = syncCanvasScheduler;
