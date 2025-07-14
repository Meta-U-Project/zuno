const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function insertPreferredTimes(userId, preferredTimes) {
    try {
        await prisma.preferredStudyTime.deleteMany({
            where: { userId }
        });

        const createdTimes = await Promise.all(
            preferredTimes.map(time =>
                prisma.preferredStudyTime.create({
                    data: {
                        userId,
                        day: time.day.toLowerCase(),
                        startTime: time.startTime,
                        endTime: time.endTime
                    }
                })
            )
        );

        console.log(`Inserted ${createdTimes.length} preferred study times for user ${userId}`);
        return createdTimes;
    } catch (error) {
        console.error('Error inserting preferred times:', error);
        throw error;
    }
}

async function insertExamplePreferredTimes(userId) {
    // sample data for preferred times
    const exampleTimes = [
        {
            day: "monday",
            startTime: "18:00",
            endTime: "21:00"
        },
        {
            day: "wednesday",
            startTime: "10:00",
            endTime: "12:00"
        },
        {
            day: "friday",
            startTime: "14:00",
            endTime: "17:00"
        },
        {
            day: "saturday",
            startTime: "09:00",
            endTime: "12:00"
        },
        {
            day: "sunday",
            startTime: "15:00",
            endTime: "18:00"
        }
    ];

    return await insertPreferredTimes(userId, exampleTimes);
}

async function getPreferredTimes(userId) {
    try {
        const preferredTimes = await prisma.preferredStudyTime.findMany({
            where: { userId },
            orderBy: [
                { day: 'asc' },
                { startTime: 'asc' }
            ]
        });

        return preferredTimes;
    } catch (error) {
        console.error('Error fetching preferred times:', error);
        throw error;
    }
}

module.exports = {
    insertPreferredTimes,
    insertExamplePreferredTimes,
    getPreferredTimes
};
