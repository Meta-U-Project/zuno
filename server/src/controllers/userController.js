const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
        }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getIntegrations = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                googleAccessToken: true,
                canvasAccessToken: true,
            }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            googleConnected: !!user.googleAccessToken,
            canvasConnected: !!user.canvasAccessToken
        });
    } catch (error) {
        console.error('Error fetching integrations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getStudyPreferences = async (req, res) => {
    try {
        const userId = req.user.id;

        const preferredTimes = await prisma.preferredStudyTime.findMany({
            where: { userId }
        });

        const preferredTimesByDay = {};
        preferredTimes.forEach(time => {
            if (!preferredTimesByDay[time.day]) {
                preferredTimesByDay[time.day] = [];
            }
            preferredTimesByDay[time.day].push({
                startTime: time.startTime,
                endTime: time.endTime
            });
        });

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const formattedPreferredTimes = days.map(day => ({
            day,
            enabled: !!preferredTimesByDay[day]?.length,
            timeRanges: preferredTimesByDay[day] || [{ startTime: '09:00', endTime: '17:00' }]
        }));

        const defaultTimes = preferredTimesByDay['default'] || [{ startTime: '09:00', endTime: '20:00' }];

        const response = {
            dailyHours: [{ day: 'default', ...defaultTimes[0] }],
            preferredTimes: formattedPreferredTimes
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching study preferences:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const saveStudyPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { preferredTimes, dailyHours } = req.body;

        await prisma.$transaction(async (prisma) => {
            await prisma.preferredStudyTime.deleteMany({
                where: { userId }
            });

            const preferencesToCreate = [];

            if (dailyHours && dailyHours.length > 0) {
                dailyHours.forEach(hours => {
                    preferencesToCreate.push({
                        userId,
                        day: hours.day || 'default',
                        startTime: hours.startTime,
                        endTime: hours.endTime
                    });
                });
            }

            if (preferredTimes && preferredTimes.length > 0) {
                preferredTimes.forEach(dayPreference => {
                    if (dayPreference.enabled && dayPreference.timeRanges) {
                        dayPreference.timeRanges.forEach(timeRange => {
                            preferencesToCreate.push({
                                userId,
                                day: dayPreference.day,
                                startTime: timeRange.startTime,
                                endTime: timeRange.endTime
                            });
                        });
                    }
                });
            }

            await prisma.preferredStudyTime.createMany({
                data: preferencesToCreate
            });
        });

        res.status(200).json({ message: 'Study preferences saved successfully' });
    } catch (error) {
        console.error('Error saving study preferences:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { getUserProfile, getIntegrations, getStudyPreferences, saveStudyPreferences };
