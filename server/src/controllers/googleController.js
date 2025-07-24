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
const checkCalendarExists = async (calendarId) => {
    try {
        try {
            await oauth2Client.getAccessToken();
        } catch (tokenError) {
            throw new Error('Authentication error: ' + tokenError.message);
        }

        if (!calendarId || calendarId === 'undefined' || calendarId === 'null') {
            return false;
        }

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        try {
            await calendar.calendars.get({
                calendarId: calendarId
            });
            return true;
        } catch (calendarError) {
            if (calendarError.response && calendarError.response.status === 404) {
                return false;
            }

            if (calendarError.response && calendarError.response.status === 403) {
                return false;
            }

            throw calendarError;
        }
    } catch (error) {
        throw error;
    }
};

const setupZunoCalendar = async (userId) => {
    try {
        await setupOAuthClient(userId);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (user.googleCalendarId) {
            const calendarExists = await checkCalendarExists(user.googleCalendarId);
            if (calendarExists) {
                return user.googleCalendarId;
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

            try {
                const calendarExists = await checkCalendarExists(user.googleCalendarId);

                if (!calendarExists) {
                    const newCalendarId = await setupZunoCalendar(userId);

                    await prisma.user.update({
                        where: { id: userId },
                        data: { googleCalendarId: newCalendarId }
                    });

                    user.googleCalendarId = newCalendarId;
                }
            } catch (setupError) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to verify or create Zuno calendar. Please reconnect your Google account.',
                    error: setupError.message
                });
            }

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            const events = await prisma.calendarEvent.findMany({
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
                    requiresStudyBlock: true,
                    OR: [
                        { googleEventId: null },
                        {
                            googleEventId: { not: null },
                            updatedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                        }
                    ]
                }
            });

            const lectures = await prisma.lecture.findMany({
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

            const syncResults = {
            eventsCreated: 0,
            eventsUpdated: 0,
            eventsDeleted: 0,
            tasksCreated: 0,
            tasksUpdated: 0,
            lecturesCreated: 0,
            lecturesUpdated: 0,
            errors: []
        };

            for (const event of events) {
                try {
                    const eventSummary = event.title || `Event for ${event.task?.title || 'Unknown'}`;
                    const eventDescription = event.description || '';
                    const startTime = event.start_time.toISOString();
                    const endTime = event.end_time.toISOString();

                    if (event.googleEventId) {
                        try {
                            await calendar.events.update({
                                calendarId: user.googleCalendarId,
                                eventId: event.googleEventId,
                                requestBody: {
                                    summary: eventSummary,
                                    description: eventDescription,
                                    start: {
                                        dateTime: startTime,
                                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                    },
                                    end: {
                                        dateTime: endTime,
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
                        } catch (updateError) {
                            if (updateError.code === 404 || (updateError.response && updateError.response.status === 404)) {
                                event.googleEventId = null;
                            } else {
                                throw updateError;
                            }
                        }
                    }

                    if (!event.googleEventId) {
                        const timeMin = new Date(event.start_time);
                        timeMin.setHours(0, 0, 0, 0);

                        const timeMax = new Date(event.start_time);
                        timeMax.setHours(23, 59, 59, 999);

                        const existingEvents = await calendar.events.list({
                            calendarId: user.googleCalendarId,
                            timeMin: timeMin.toISOString(),
                            timeMax: timeMax.toISOString(),
                            q: eventSummary
                        });

                        let googleEventId;

                        if (existingEvents.data.items && existingEvents.data.items.length > 0) {
                            const existingEvent = existingEvents.data.items[0];
                            await calendar.events.update({
                                calendarId: user.googleCalendarId,
                                eventId: existingEvent.id,
                                requestBody: {
                                    summary: eventSummary,
                                    description: eventDescription,
                                    start: {
                                        dateTime: startTime,
                                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                    },
                                    end: {
                                        dateTime: endTime,
                                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                    },
                                    colorId: '3',
                                    source: {
                                        title: 'Zuno',
                                        url: `${process.env.CLIENT_URL}/calendar`
                                    }
                                }
                            });
                            googleEventId = existingEvent.id;
                            syncResults.eventsUpdated++;
                        } else {
                            const googleEvent = await calendar.events.insert({
                                calendarId: user.googleCalendarId,
                                requestBody: {
                                    summary: eventSummary,
                                    description: eventDescription,
                                    start: {
                                        dateTime: startTime,
                                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                    },
                                    end: {
                                        dateTime: endTime,
                                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                    },
                                    colorId: '3',
                                    source: {
                                        title: 'Zuno',
                                        url: `${process.env.CLIENT_URL}/calendar`
                                    }
                                }
                            });
                            googleEventId = googleEvent.data.id;
                            syncResults.eventsCreated++;
                        }

                        await prisma.calendarEvent.update({
                            where: { id: event.id },
                            data: { googleEventId: googleEventId }
                        });
                    }
                } catch (error) {
                    console.error(`Error syncing event ${event.id}:`, error);
                    syncResults.errors.push(`Failed to sync event "${event.title}": ${error.message}`);
                }
            }

            for (const task of tasks) {
            try {
                const eventSummary = task.title;
                const eventDescription = task.description || '';
                const eventDate = task.deadline ? task.deadline.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

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
                    const dateMin = eventDate;
                    const dateMax = eventDate;

                    const existingEvents = await calendar.events.list({
                        calendarId: user.googleCalendarId,
                        timeMin: `${dateMin}T00:00:00Z`,
                        timeMax: `${dateMax}T23:59:59Z`,
                        q: eventSummary
                    });

                    let googleEventId;

                    if (existingEvents.data.items && existingEvents.data.items.length > 0) {
                        const existingEvent = existingEvents.data.items[0];
                        await calendar.events.update({
                            calendarId: user.googleCalendarId,
                            eventId: existingEvent.id,
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
                        googleEventId = existingEvent.id;
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
                        googleEventId = googleEvent.data.id;
                        syncResults.tasksCreated++;
                    }

                    await prisma.task.update({
                        where: { id: task.id },
                        data: { googleEventId: googleEventId }
                    });
                }
            } catch (error) {
                console.error(`Error syncing task ${task.id}:`, error);
                syncResults.errors.push(`Failed to sync task "${task.title}": ${error.message}`);
            }
        }

            const { syncLecturesToGoogleCalendarBatch } = require('../utils/googleCalendarBatchUtils');

            try {
                const batchResults = await syncLecturesToGoogleCalendarBatch(userId, lectures, oauth2Client);
                syncResults.lecturesCreated += batchResults.created;
                syncResults.lecturesUpdated += batchResults.updated;
                syncResults.errors = [...syncResults.errors, ...batchResults.errors];
            } catch (error) {
                syncResults.errors.push(`Failed to sync lectures in batch: ${error.message}`);
            }

            const deletedEvents = [];

            for (const event of deletedEvents) {
            try {
                await calendar.events.delete({
                    calendarId: user.googleCalendarId,
                    eventId: event.googleEventId
                });

                await prisma.calendarEvent.update({
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

            if (syncResults.errors.length > 0) {
                res.status(207).json({
                    success: true,
                    message: 'Calendar sync completed with some errors',
                    results: syncResults,
                    errors: syncResults.errors
                });
            } else {
                res.status(200).json({
                    success: true,
                    message: 'Calendar sync completed successfully',
                    results: syncResults
                });
            }
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

const { syncSingleLectureWithRetry } = require('../utils/googleCalendarBatchUtils');

const syncLectureToGoogleCalendar = async (userId, lectureId) => {
    try {
        await setupOAuthClient(userId);
        return await syncSingleLectureWithRetry(userId, lectureId, oauth2Client);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    auth,
    callback,
    checkAndCreateCalendar,
    setupZunoCalendar,
    syncCalendarEvents,
    syncLectureToGoogleCalendar
};
