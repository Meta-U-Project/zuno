const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const { google } = require('googleapis');
const { setupZunoCalendar } = require('./googleController');

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
            school: true,
        }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const preferredTimes = await prisma.preferredStudyTime.findMany({
            where: { userId }
        });

        const hasPreferences = preferredTimes.length > 0;

        res.json({
            ...user,
            hasPreferences
        });
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

        const jwt = require('jsonwebtoken');
        const token = jwt.sign({
            id: userId,
            hasPreferences: true
        }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({ message: 'Study preferences saved successfully' });
    } catch (error) {
        console.error('Error saving study preferences:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName, school } = req.body;

        if (!firstName || !lastName) {
            return res.status(400).json({ message: 'First name and last name are required' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                school
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                school: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getUserTasks = async (req, res) => {
    try {
        const userId = req.user.id;

        const tasks = await prisma.task.findMany({
            where: { userId },
            orderBy: [
                { deadline: 'asc' },
                { createdAt: 'desc' }
            ],
            include: {
                course: {
                    select: {
                        course_name: true
                    }
                }
            }
        });

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching user tasks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getCalendarEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        const { taskId } = req.query;

        let whereClause = { userId };

        if (taskId) {
            whereClause.taskId = taskId;
        }

        const events = await prisma.calendarEvent.findMany({
            where: whereClause,
            orderBy: { start_time: 'asc' }
        });

        res.json(events);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
const syncWithGoogleCalendar = async (userId, event, operation = 'create') => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                googleAccessToken: true,
                googleRefreshToken: true,
                googleTokenExpiry: true,
                googleCalendarId: true
            }
        });

        if (!user.googleAccessToken || !user.googleCalendarId) {
            return null;
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken,
            expiry_date: user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : undefined
        });

        if (user.googleTokenExpiry && user.googleTokenExpiry < new Date()) {
            try {
                const { tokens } = await oauth2Client.refreshToken(user.googleRefreshToken);

                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        googleAccessToken: tokens.access_token,
                        googleTokenExpiry: new Date(tokens.expiry_date)
                    }
                });

                oauth2Client.setCredentials({
                    access_token: tokens.access_token,
                    refresh_token: user.googleRefreshToken,
                    expiry_date: tokens.expiry_date
                });
            } catch (refreshError) {
                console.error('Error refreshing Google token:', refreshError);
                return null;
            }
        }

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const task = await prisma.task.findUnique({
            where: { id: event.taskId },
            select: { title: true, description: true }
        });

        const googleEvent = {
            summary: `${event.type === 'TASK_BLOCK' ? 'Study Block: ' : ''}${task.title}`,
            description: task.description || 'No description',
            start: {
                dateTime: new Date(event.start_time).toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: new Date(event.end_time).toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            location: event.location || '',
            colorId: event.type === 'TASK_BLOCK' ? '3' : '1',
            extendedProperties: {
                private: {
                    zunoEventId: event.id,
                    zunoTaskId: event.taskId,
                    zunoEventType: event.type
                }
            }
        };

        let result = null;

        if (operation === 'create') {
            const response = await calendar.events.insert({
                calendarId: user.googleCalendarId,
                requestBody: googleEvent
            });
            result = response.data.id;
        } else if (operation === 'update') {
            const existingEvent = await prisma.calendarEvent.findUnique({
                where: { id: event.id },
                select: { googleEventId: true }
            });

            if (existingEvent && existingEvent.googleEventId) {
                const response = await calendar.events.update({
                    calendarId: user.googleCalendarId,
                    eventId: existingEvent.googleEventId,
                    requestBody: googleEvent
                });
                result = response.data.id;
            } else {
                const response = await calendar.events.insert({
                    calendarId: user.googleCalendarId,
                    requestBody: googleEvent
                });
                result = response.data.id;
            }
        } else if (operation === 'delete') {
            const existingEvent = await prisma.calendarEvent.findUnique({
                where: { id: event.id },
                select: { googleEventId: true }
            });

            if (existingEvent && existingEvent.googleEventId) {
                await calendar.events.delete({
                    calendarId: user.googleCalendarId,
                    eventId: existingEvent.googleEventId
                });
                result = existingEvent.googleEventId;
            }
        }

        return result;
    } catch (error) {
        console.error(`Error syncing with Google Calendar (${operation}):`, error);
        return null;
    }
};

const createCalendarEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { taskId, start_time, end_time, type, is_group_event, location, syncWithGoogle } = req.body;

        const newEvent = await prisma.calendarEvent.create({
            data: {
                userId,
                taskId,
                start_time: new Date(start_time),
                end_time: new Date(end_time),
                type: type || 'TASK_BLOCK',
                is_group_event: is_group_event || false,
                location: location || '',
                createdById: userId,
                googleEventId: null
            }
        });

        if (syncWithGoogle) {
            try {
                const googleEventId = await syncWithGoogleCalendar(userId, newEvent, 'create');

                if (googleEventId) {
                    await prisma.calendarEvent.update({
                        where: { id: newEvent.id },
                        data: { googleEventId }
                    });

                    newEvent.googleEventId = googleEventId;
                }
            } catch (syncError) {
                console.error('Error syncing with Google Calendar:', syncError);
            }
        }

        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error creating calendar event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateCalendarEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { eventId } = req.params;
        const { start_time, end_time, type, is_group_event, location, syncWithGoogle } = req.body;

        const event = await prisma.calendarEvent.findFirst({
            where: {
                id: eventId,
                userId
            }
        });

        if (!event) {
            return res.status(404).json({ message: 'Calendar event not found' });
        }

        const updatedEvent = await prisma.calendarEvent.update({
            where: { id: eventId },
            data: {
                start_time: start_time ? new Date(start_time) : undefined,
                end_time: end_time ? new Date(end_time) : undefined,
                type,
                is_group_event,
                location
            }
        });

        if (syncWithGoogle) {
            try {
                const googleEventId = await syncWithGoogleCalendar(userId, updatedEvent, 'update');

                if (googleEventId && googleEventId !== updatedEvent.googleEventId) {
                    await prisma.calendarEvent.update({
                        where: { id: eventId },
                        data: { googleEventId }
                    });

                    updatedEvent.googleEventId = googleEventId;
                }
            } catch (syncError) {
                console.error('Error syncing with Google Calendar:', syncError);
            }
        }

        res.json(updatedEvent);
    } catch (error) {
        console.error('Error updating calendar event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteCalendarEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { eventId } = req.params;
        const { syncWithGoogle } = req.body;

        const event = await prisma.calendarEvent.findFirst({
            where: {
                id: eventId,
                userId
            }
        });

        if (!event) {
            return res.status(404).json({ message: 'Calendar event not found' });
        }

        if (syncWithGoogle && event.googleEventId) {
            try {
                await syncWithGoogleCalendar(userId, event, 'delete');
            } catch (syncError) {
                console.error('Error syncing with Google Calendar:', syncError);
            }
        }

        await prisma.calendarEvent.delete({
            where: { id: eventId }
        });

        res.json({ message: 'Calendar event deleted successfully' });
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const syncAllCalendarEvents = async (req, res) => {
    try {
        const userId = req.user.id;

        const events = await prisma.calendarEvent.findMany({
            where: { userId }
        });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                googleAccessToken: true,
                googleRefreshToken: true,
                googleTokenExpiry: true,
                googleCalendarId: true
            }
        });

        if (!user.googleAccessToken) {
            return res.status(400).json({
                success: false,
                message: 'Google account not connected. Please connect your Google account first.'
            });
        }

        if (!user.googleCalendarId) {
            try {
                const tokens = {
                    access_token: user.googleAccessToken,
                    refresh_token: user.googleRefreshToken,
                    expiry_date: user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : undefined
                };

                await setupZunoCalendar(userId, tokens);

                const updatedUser = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { googleCalendarId: true }
                });

                if (!updatedUser.googleCalendarId) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create Zuno calendar in Google Calendar.'
                    });
                }
            } catch (error) {
                console.error('Error setting up Zuno calendar:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to set up Zuno calendar',
                    error: error.message
                });
            }
        }

        const results = await Promise.all(
            events.map(async (event) => {
                try {
                    const googleEventId = await syncWithGoogleCalendar(userId, event, 'create');

                    if (googleEventId) {
                        await prisma.calendarEvent.update({
                            where: { id: event.id },
                            data: { googleEventId }
                        });

                        return {
                            eventId: event.id,
                            success: true,
                            googleEventId
                        };
                    } else {
                        return {
                            eventId: event.id,
                            success: false,
                            error: 'Failed to sync with Google Calendar'
                        };
                    }
                } catch (error) {
                    console.error(`Error syncing event ${event.id}:`, error);
                    return {
                        eventId: event.id,
                        success: false,
                        error: error.message
                    };
                }
            })
        );

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        res.status(200).json({
            success: true,
            message: `Synced ${successCount} events with Google Calendar. ${failureCount} events failed to sync.`,
            results
        });
    } catch (error) {
        console.error('Error syncing all calendar events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync calendar events with Google Calendar',
            error: error.message
        });
    }
};

module.exports = {
    getUserProfile,
    getIntegrations,
    getStudyPreferences,
    saveStudyPreferences,
    updateUserProfile,
    getUserTasks,
    getCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    syncAllCalendarEvents,
    syncWithGoogleCalendar
};
