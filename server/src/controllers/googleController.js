const { google } = require('googleapis');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);
const setupOAuthClient = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            googleAccessToken: true,
            googleRefreshToken: true,
            googleTokenExpiry: true
        }
    });

    if (!user.googleAccessToken || !user.googleRefreshToken) {
        throw new Error('Google account not connected');
    }

    oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
        expiry_date: user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : undefined
    });

    oauth2Client.on('tokens', async (tokens) => {
        const updates = {};

        if (tokens.access_token) {
            updates.googleAccessToken = tokens.access_token;
        }

        if (tokens.refresh_token) {
            updates.googleRefreshToken = tokens.refresh_token;
        }

        if (tokens.expiry_date) {
            updates.googleTokenExpiry = new Date(tokens.expiry_date);
        }

        if (Object.keys(updates).length > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: updates
            });
        }
    });

    return oauth2Client;
};

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
];


const auth = async (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
        state: req.user.id
    });
    res.redirect(authUrl);
};
const setupZunoCalendar = async (userId) => {
    try {
        await setupOAuthClient(userId);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (user.googleCalendarId) {
            try {
                await calendar.calendars.get({
                    calendarId: user.googleCalendarId
                });
                return user.googleCalendarId;
            } catch (error) {
                console.error('Calendar not found, creating a new one:', error.message);
            }
        }

        const newCalendar = await calendar.calendars.insert({
            requestBody: {
                summary: 'Zuno Calendar',
                description: 'Calendar for Zuno academic events and study blocks',
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        });

        await prisma.user.update({
            where: { id: userId },
            data: {
                googleCalendarId: newCalendar.data.id
            }
        });

        return newCalendar.data.id;
    } catch (error) {
        console.error('Error setting up Zuno calendar:', error);
        throw error;
    }
};

const callback = async (req, res) => {
    try {
        const { code, state } = req.query;
        const { tokens } = await oauth2Client.getToken(code);
        const userId = state;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
                googleTokenExpiry: new Date(tokens.expiry_date)
            }
        });
        try {
            await setupZunoCalendar(userId);
        } catch (error) {
            console.error('Error setting up Zuno calendar:', error);
        }
        const canvasConnected = !!updatedUser.canvasAccessToken;

        if (canvasConnected) {
            res.redirect(`${process.env.CLIENT_URL}/dashboard?google=connected`);
        } else {
            res.redirect(`${process.env.CLIENT_URL}/connect?google=connected`);
        }
    } catch (error) {
        console.error('Google OAuth Failed:', error);
        res.status(500).send("Google OAuth Failed.");
    }
};
const checkAndCreateCalendar = async (req, res) => {
    try {
        const userId = req.user.id;

        try {
            const calendarId = await setupZunoCalendar(userId);

            res.status(200).json({
                success: true,
                message: 'Zuno calendar setup complete',
                calendarId
            });
        } catch (error) {
            if (error.message === 'Google account not connected') {
                return res.status(400).json({
                    success: false,
                    message: 'Google account not connected. Please connect your Google account first.'
                });
            }

            if (error.response && error.response.status === 401) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication error. Please reconnect your Google account.',
                    error: error.message
                });
            }

            throw error;
        }
    } catch (error) {
        console.error('Error checking/creating calendar:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set up Zuno calendar',
            error: error.message
        });
    }
};

const syncCalendarEvents = async (req, res) => {
    try {
        const userId = req.user.id;

        try {
            await setupOAuthClient(userId);

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    googleCalendarId: true
                }
            });

            if (!user.googleCalendarId) {
                return res.status(400).json({
                    success: false,
                    message: 'Zuno calendar not set up. Please set up your Zuno calendar first.'
                });
            }

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            const events = await prisma.event.findMany({
            where: {
                userId: userId,
                OR: [
                    { googleEventId: null },
                    {
                        googleEventId: { not: null },
                        updatedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                    }
                ]
            }
        });

            const tasks = await prisma.task.findMany({
            where: {
                userId: userId,
                addToCalendar: true,
                OR: [
                    { googleEventId: null },
                    {
                        googleEventId: { not: null },
                        updatedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                    }
                ]
            }
        });

            const syncResults = {
            eventsCreated: 0,
            eventsUpdated: 0,
            eventsDeleted: 0,
            tasksCreated: 0,
            tasksUpdated: 0,
            errors: []
        };

            for (const event of events) {
            try {
                if (event.googleEventId) {
                    await calendar.events.update({
                        calendarId: user.googleCalendarId,
                        eventId: event.googleEventId,
                        requestBody: {
                            summary: event.title,
                            description: event.description || '',
                            start: {
                                dateTime: event.startTime.toISOString(),
                                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                            },
                            end: {
                                dateTime: event.endTime.toISOString(),
                                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                            },
                            colorId: '3',
                            source: {
                                title: 'Zuno',
                                url: `${process.env.CLIENT_URL}/calendar`
                            }
                        }
                    });
                    syncResults.eventsUpdated++;
                } else {
                    const googleEvent = await calendar.events.insert({
                        calendarId: user.googleCalendarId,
                        requestBody: {
                            summary: event.title,
                            description: event.description || '',
                            start: {
                                dateTime: event.startTime.toISOString(),
                                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                            },
                            end: {
                                dateTime: event.endTime.toISOString(),
                                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                            },
                            colorId: '3',
                            source: {
                                title: 'Zuno',
                                url: `${process.env.CLIENT_URL}/calendar`
                            }
                        }
                    });

                    await prisma.event.update({
                        where: { id: event.id },
                        data: { googleEventId: googleEvent.data.id }
                    });
                    syncResults.eventsCreated++;
                }
            } catch (error) {
                console.error(`Error syncing event ${event.id}:`, error);
                syncResults.errors.push(`Failed to sync event "${event.title}": ${error.message}`);
            }
        }

            for (const task of tasks) {
            try {
                const eventSummary = `[Task] ${task.title}`;
                const eventDescription = task.description || '';
                const eventDate = task.dueDate.toISOString().split('T')[0];

                if (task.googleEventId) {
                    await calendar.events.update({
                        calendarId: user.googleCalendarId,
                        eventId: task.googleEventId,
                        requestBody: {
                            summary: eventSummary,
                            description: eventDescription,
                            start: {
                                date: eventDate,
                            },
                            end: {
                                date: eventDate,
                            },
                            colorId: '10',
                            source: {
                                title: 'Zuno',
                                url: `${process.env.CLIENT_URL}/tasks`
                            }
                        }
                    });
                    syncResults.tasksUpdated++;
                } else {
                    const googleEvent = await calendar.events.insert({
                        calendarId: user.googleCalendarId,
                        requestBody: {
                            summary: eventSummary,
                            description: eventDescription,
                            start: {
                                date: eventDate,
                            },
                            end: {
                                date: eventDate,
                            },
                            colorId: '10',
                            source: {
                                title: 'Zuno',
                                url: `${process.env.CLIENT_URL}/tasks`
                            }
                        }
                    });

                    await prisma.task.update({
                        where: { id: task.id },
                        data: { googleEventId: googleEvent.data.id }
                    });
                    syncResults.tasksCreated++;
                }
            } catch (error) {
                console.error(`Error syncing task ${task.id}:`, error);
                syncResults.errors.push(`Failed to sync task "${task.title}": ${error.message}`);
            }
        }

            const deletedEvents = await prisma.event.findMany({
            where: {
                userId: userId,
                googleEventId: { not: null },
                deleted: true
            }
        });

            for (const event of deletedEvents) {
            try {
                await calendar.events.delete({
                    calendarId: user.googleCalendarId,
                    eventId: event.googleEventId
                });

                await prisma.event.update({
                    where: { id: event.id },
                    data: { googleEventId: null }
                });

                syncResults.eventsDeleted++;
            } catch (error) {
                console.error(`Error deleting event ${event.id}:`, error);
                syncResults.errors.push(`Failed to delete event "${event.title}": ${error.message}`);
            }
        }
            await prisma.user.update({
                where: { id: userId },
                data: { lastGoogleSync: new Date() }
            });

            res.status(200).json({
                success: true,
                message: 'Calendar sync completed',
                results: syncResults
            });
        } catch (error) {
            if (error.message === 'Google account not connected') {
                return res.status(400).json({
                    success: false,
                    message: 'Google account not connected. Please connect your Google account first.'
                });
            }

            if (error.response && error.response.status === 401) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication error. Please reconnect your Google account.',
                    error: error.message
                });
            }

            throw error;
        }
    } catch (error) {
        console.error('Error syncing calendar events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync calendar events',
            error: error.message
        });
    }
};

module.exports = {
    auth,
    callback,
    checkAndCreateCalendar,
    setupZunoCalendar,
    syncCalendarEvents
};
