const { google } = require('googleapis');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const syncLecturesToGoogleCalendarBatch = async (userId, lectures, oauth2Client) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                googleCalendarId: true
            }
        });

        if (!user.googleCalendarId) {
            throw new Error('Zuno calendar not set up');
        }

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const results = {
            created: 0,
            updated: 0,
            errors: []
        };

        const BATCH_SIZE = 10;
        const INITIAL_DELAY = 100;
        const MAX_DELAY = 60000;
        const MAX_RETRIES = 5;

        let currentDelay = INITIAL_DELAY;

        for (let i = 0; i < lectures.length; i += BATCH_SIZE) {
            const batch = lectures.slice(i, i + BATCH_SIZE);

            for (const lecture of batch) {
                let retries = 0;
                let success = false;

                while (!success && retries < MAX_RETRIES) {
                    try {
                        const eventSummary = lecture.title;
                        const eventDescription = lecture.description || '';
                        const location = lecture.location || '';

                        if (lecture.googleEventId) {
                            try {
                                await calendar.events.update({
                                    calendarId: user.googleCalendarId,
                                    eventId: lecture.googleEventId,
                                    requestBody: {
                                        summary: eventSummary,
                                        description: eventDescription,
                                        location: location,
                                        start: {
                                            dateTime: lecture.start_time.toISOString(),
                                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                        },
                                        end: {
                                            dateTime: lecture.end_time.toISOString(),
                                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                        },
                                        colorId: '5',
                                        source: {
                                            title: 'Zuno',
                                            url: `${process.env.CLIENT_URL}/calendar`
                                        }
                                    }
                                });
                                results.updated++;
                            } catch (error) {
                                if (error.code === 404 || (error.response && error.response.status === 404)) {
                                    const googleEvent = await calendar.events.insert({
                                        calendarId: user.googleCalendarId,
                                        requestBody: {
                                            summary: eventSummary,
                                            description: eventDescription,
                                            location: location,
                                            start: {
                                                dateTime: lecture.start_time.toISOString(),
                                                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                            },
                                            end: {
                                                dateTime: lecture.end_time.toISOString(),
                                                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                            },
                                            colorId: '5',
                                            source: {
                                                title: 'Zuno',
                                                url: `${process.env.CLIENT_URL}/calendar`
                                            }
                                        }
                                    });

                                    await prisma.lecture.update({
                                        where: { id: lecture.id },
                                        data: { googleEventId: googleEvent.data.id }
                                    });
                                    results.created++;
                                } else {
                                    throw error;
                                }
                            }
                        } else {
                            const timeMin = new Date(lecture.start_time.getTime() - 60000);
                            const timeMax = new Date(lecture.start_time.getTime() + 60000);

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
                                        location: location,
                                        start: {
                                            dateTime: lecture.start_time.toISOString(),
                                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                        },
                                        end: {
                                            dateTime: lecture.end_time.toISOString(),
                                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                        },
                                        colorId: '5',
                                        source: {
                                            title: 'Zuno',
                                            url: `${process.env.CLIENT_URL}/calendar`
                                        }
                                    }
                                });
                                googleEventId = existingEvent.id;
                                results.updated++;
                            } else {
                                const googleEvent = await calendar.events.insert({
                                    calendarId: user.googleCalendarId,
                                    requestBody: {
                                        summary: eventSummary,
                                        description: eventDescription,
                                        location: location,
                                        start: {
                                            dateTime: lecture.start_time.toISOString(),
                                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                        },
                                        end: {
                                            dateTime: lecture.end_time.toISOString(),
                                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                        },
                                        colorId: '5',
                                        source: {
                                            title: 'Zuno',
                                            url: `${process.env.CLIENT_URL}/calendar`
                                        }
                                    }
                                });
                                googleEventId = googleEvent.data.id;
                                results.created++;
                            }

                            await prisma.lecture.update({
                                where: { id: lecture.id },
                                data: { googleEventId: googleEventId }
                            });
                        }

                        success = true;
                        currentDelay = INITIAL_DELAY;

                    } catch (error) {
                        retries++;

                        if (error.code === 429 || (error.response && error.response.status === 429)) {
                            currentDelay = Math.min(currentDelay * 2, MAX_DELAY);
                            await delay(currentDelay);
                        } else if (retries >= MAX_RETRIES) {
                            results.errors.push(`Failed to sync lecture "${lecture.title}" after ${MAX_RETRIES} retries: ${error.message}`);
                            break;
                        } else {
                            await delay(currentDelay);
                        }
                    }
                }
            }

            if (i + BATCH_SIZE < lectures.length) {
                await delay(currentDelay);
            }
        }

        return results;
    } catch (error) {
        throw error;
    }
};

const syncSingleLectureWithRetry = async (userId, lectureId, oauth2Client) => {
    const MAX_RETRIES = 3;
    const INITIAL_DELAY = 1000;
    const MAX_DELAY = 10000;

    let currentDelay = INITIAL_DELAY;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    googleCalendarId: true
                }
            });

            if (!user.googleCalendarId) {
                throw new Error('Zuno calendar not set up');
            }

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            const lecture = await prisma.lecture.findUnique({
                where: { id: lectureId },
                include: {
                    course: {
                        select: {
                            course_name: true
                        }
                    }
                }
            });

            if (!lecture) {
                throw new Error(`Lecture with ID ${lectureId} not found`);
            }

            const eventSummary = lecture.title;
            const eventDescription = lecture.description || '';
            const location = lecture.location || '';

            if (lecture.googleEventId) {
                try {
                    await calendar.events.update({
                        calendarId: user.googleCalendarId,
                        eventId: lecture.googleEventId,
                        requestBody: {
                            summary: eventSummary,
                            description: eventDescription,
                            location: location,
                            start: {
                                dateTime: lecture.start_time.toISOString(),
                                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                            },
                            end: {
                                dateTime: lecture.end_time.toISOString(),
                                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                            },
                            colorId: '5',
                            source: {
                                title: 'Zuno',
                                url: `${process.env.CLIENT_URL}/calendar`
                            }
                        }
                    });

                    return lecture.googleEventId;
                } catch (error) {
                    if (error.code === 404 || (error.response && error.response.status === 404)) {
                    } else {
                        throw error;
                    }
                }
            }

            const timeMin = new Date(lecture.start_time.getTime() - 60000);
            const timeMax = new Date(lecture.start_time.getTime() + 60000);

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
                        location: location,
                        start: {
                            dateTime: lecture.start_time.toISOString(),
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        },
                        end: {
                            dateTime: lecture.end_time.toISOString(),
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        },
                        colorId: '5',
                        source: {
                            title: 'Zuno',
                            url: `${process.env.CLIENT_URL}/calendar`
                        }
                    }
                });
                googleEventId = existingEvent.id;
            } else {
                const googleEvent = await calendar.events.insert({
                    calendarId: user.googleCalendarId,
                    requestBody: {
                        summary: eventSummary,
                        description: eventDescription,
                        location: location,
                        start: {
                            dateTime: lecture.start_time.toISOString(),
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        },
                        end: {
                            dateTime: lecture.end_time.toISOString(),
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        },
                        colorId: '5',
                        source: {
                            title: 'Zuno',
                            url: `${process.env.CLIENT_URL}/calendar`
                        }
                    }
                });
                googleEventId = googleEvent.data.id;
            }

            await prisma.lecture.update({
                where: { id: lectureId },
                data: { googleEventId: googleEventId }
            });

            return googleEventId;

        } catch (error) {
            retries++;

            if (error.code === 429 || (error.response && error.response.status === 429)) {
                currentDelay = Math.min(currentDelay * 2, MAX_DELAY);
                await delay(currentDelay);
            } else if (retries >= MAX_RETRIES) {
                throw error;
            } else {
                await delay(currentDelay);
            }
        }
    }

    throw new Error(`Failed to sync lecture ${lectureId} after ${MAX_RETRIES} retries`);
};

module.exports = {
    syncLecturesToGoogleCalendarBatch,
    syncSingleLectureWithRetry,
    delay
};
