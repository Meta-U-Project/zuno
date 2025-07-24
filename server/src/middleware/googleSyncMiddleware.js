const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const { google } = require('googleapis');
const { setupZunoCalendar } = require('../controllers/googleController');

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
        return null;
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

const checkCalendarExists = async (auth, calendarId) => {
    try {
        const calendar = google.calendar({ version: 'v3', auth });
        await calendar.calendars.get({
            calendarId: calendarId
        });
        return true;
    } catch (error) {
        console.error('Calendar check failed:', error.message);
        return false;
    }
};

const syncToGoogleCalendar = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return next();
        }

        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                googleAccessToken: true,
                googleRefreshToken: true,
                googleCalendarId: true
            }
        });

        if (!user.googleAccessToken || !user.googleRefreshToken || !user.googleCalendarId) {
            return next();
        }

        const auth = await setupOAuthClient(userId);
        if (!auth) {
            return next();
        }

        if (user.googleCalendarId) {
            const calendarExists = await checkCalendarExists(auth, user.googleCalendarId);
            if (!calendarExists) {
                try {
                    const newCalendarId = await setupZunoCalendar(userId);

                    await prisma.user.update({
                        where: { id: userId },
                        data: { googleCalendarId: newCalendarId }
                    });

                    user.googleCalendarId = newCalendarId;
                } catch (error) {
                    console.error('Failed to recreate calendar:', error);
                    return next();
                }
            }
        }

        res.locals.originalData = req.body;
        res.locals.userId = userId;
        res.locals.googleCalendarId = user.googleCalendarId;

        return next();
    } catch (error) {
        console.error('Error in Google Calendar sync middleware:', error);
        return next();
    }
};

const syncEntityAfterSave = async (req, res, next) => {
    if (!req.user || !req.user.id || !res.locals.originalData || !res.locals.entityType || !res.locals.entityId) {
        return next();
    }

    try {
        const userId = res.locals.userId;
        const googleCalendarId = res.locals.googleCalendarId;
        const entityType = res.locals.entityType;
        const entityId = res.locals.entityId;

        const auth = await setupOAuthClient(userId);
        if (!auth) {
            return next();
        }

        const calendar = google.calendar({ version: 'v3', auth });

        let entity;
        switch (entityType) {
            case 'calendarEvent':
                entity = await prisma.calendarEvent.findUnique({
                    where: { id: entityId },
                    include: { task: true }
                });
                break;
            case 'task':
                entity = await prisma.task.findUnique({
                    where: { id: entityId }
                });
                break;
            default:
                return next();
        }

        if (!entity) {
            return next();
        }

        let googleEvent;
        switch (entityType) {
            case 'calendarEvent':
                googleEvent = await syncCalendarEventToGoogle(calendar, googleCalendarId, entity);
                break;
            case 'task':
                googleEvent = await syncTaskToGoogle(calendar, googleCalendarId, entity);
                break;
        }

        if (googleEvent) {
            switch (entityType) {
                case 'calendarEvent':
                    await prisma.calendarEvent.update({
                        where: { id: entityId },
                        data: { googleEventId: googleEvent.id }
                    });
                    break;
                case 'task':
                    await prisma.task.update({
                        where: { id: entityId },
                        data: { googleEventId: googleEvent.id }
                    });
                    break;
            }
        }
    } catch (error) {
        console.error(`Error syncing ${res.locals.entityType} to Google Calendar:`, error);
    }

    return next();
};

const syncCalendarEventToGoogle = async (calendar, calendarId, event) => {
    try {
        const eventData = {
            summary: event.title || `Event for ${event.task?.title || 'Unknown'}`,
            description: event.description || '',
            start: {
                dateTime: event.start_time.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: event.end_time.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            location: event.location || '',
            colorId: '3',
            source: {
                title: 'Zuno',
                url: `${process.env.CLIENT_URL}/calendar`
            }
        };

        let response;
        if (event.googleEventId) {
            try {
                response = await calendar.events.update({
                    calendarId: calendarId,
                    eventId: event.googleEventId,
                    requestBody: eventData
                });
            } catch (error) {
                if (error.code === 404) {
                    response = await calendar.events.insert({
                        calendarId: calendarId,
                        requestBody: eventData
                    });
                } else {
                    throw error;
                }
            }
        } else {
            const timeMin = new Date(event.start_time.getTime() - 60000);
            const timeMax = new Date(event.start_time.getTime() + 60000);

            const existingEvents = await calendar.events.list({
                calendarId: calendarId,
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                q: eventData.summary
            });

            if (existingEvents.data.items && existingEvents.data.items.length > 0) {
                const existingEvent = existingEvents.data.items[0];
                response = await calendar.events.update({
                    calendarId: calendarId,
                    eventId: existingEvent.id,
                    requestBody: eventData
                });
            } else {
                response = await calendar.events.insert({
                    calendarId: calendarId,
                    requestBody: eventData
                });
            }
        }

        return response.data;
    } catch (error) {
        console.error('Error syncing calendar event to Google:', error);
        throw error;
    }
};

const syncTaskToGoogle = async (calendar, calendarId, task) => {
    try {
        if (!task.deadline) {
            return null;
        }

        const eventData = {
            summary: task.title,
            description: task.description || '',
            start: {
                date: task.deadline.toISOString().split('T')[0],
            },
            end: {
                date: task.deadline.toISOString().split('T')[0],
            },
            colorId: '10',
            source: {
                title: 'Zuno',
                url: `${process.env.CLIENT_URL}/tasks`
            }
        };

        let response;
        if (task.googleEventId) {
            try {
                response = await calendar.events.update({
                    calendarId: calendarId,
                    eventId: task.googleEventId,
                    requestBody: eventData
                });
            } catch (error) {
                if (error.code === 404) {
                    response = await calendar.events.insert({
                        calendarId: calendarId,
                        requestBody: eventData
                    });
                } else {
                    throw error;
                }
            }
        } else {
            const dateMin = task.deadline.toISOString().split('T')[0];
            const dateMax = dateMin;

            const existingEvents = await calendar.events.list({
                calendarId: calendarId,
                timeMin: `${dateMin}T00:00:00Z`,
                timeMax: `${dateMax}T23:59:59Z`,
                q: eventData.summary
            });

            if (existingEvents.data.items && existingEvents.data.items.length > 0) {
                const existingEvent = existingEvents.data.items[0];
                response = await calendar.events.update({
                    calendarId: calendarId,
                    eventId: existingEvent.id,
                    requestBody: eventData
                });
            } else {
                response = await calendar.events.insert({
                    calendarId: calendarId,
                    requestBody: eventData
                });
            }
        }

        return response.data;
    } catch (error) {
        console.error('Error syncing task to Google:', error);
        throw error;
    }
};

const prepareCalendarEventSync = (_req, res, next) => {
    res.locals.entityType = 'calendarEvent';
    next();
};

const prepareTaskSync = (_req, res, next) => {
    res.locals.entityType = 'task';
    next();
};


const handleEntityDeletion = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return next();
        }

        const userId = req.user.id;
        const entityId = req.params.id;
        const entityType = res.locals.entityType;

        if (!entityId || !entityType) {
            return next();
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                googleAccessToken: true,
                googleRefreshToken: true,
                googleCalendarId: true
            }
        });

        if (!user.googleAccessToken || !user.googleRefreshToken || !user.googleCalendarId) {
            return next();
        }

        const auth = await setupOAuthClient(userId);
        if (!auth) {
            return next();
        }

        const calendar = google.calendar({ version: 'v3', auth });

        let entity;
        switch (entityType) {
            case 'calendarEvent':
                entity = await prisma.calendarEvent.findUnique({
                    where: { id: entityId },
                    select: { googleEventId: true }
                });
                break;
            case 'task':
                entity = await prisma.task.findUnique({
                    where: { id: entityId },
                    select: { googleEventId: true }
                });
                break;
            default:
                return next();
        }

        if (entity && entity.googleEventId) {
            try {
                await calendar.events.delete({
                    calendarId: user.googleCalendarId,
                    eventId: entity.googleEventId
                });
            } catch (error) {
                console.error(`Error deleting ${entityType} from Google Calendar:`, error);
            }
        }

        return next();
    } catch (error) {
        console.error('Error in entity deletion middleware:', error);
        return next();
    }
};

module.exports = {
    syncToGoogleCalendar,
    syncEntityAfterSave,
    prepareCalendarEventSync,
    prepareTaskSync,
    handleEntityDeletion
};
