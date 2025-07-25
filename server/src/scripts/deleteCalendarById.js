/**
 * Script to delete a specific Google Calendar by its ID
 *
 * Usage:
 * 1. Make sure you have the correct .env file with Google OAuth credentials
 * 2. Run with: node src/scripts/deleteCalendarById.js [calendarId] [userId]
 *
 * The userId is optional. If provided, the script will also clear the googleCalendarId
 * from the user's record if it matches the calendar being deleted.
 */

require('dotenv').config();
const { google } = require('googleapis');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

async function setupOAuthClient(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            googleAccessToken: true,
            googleRefreshToken: true,
            googleTokenExpiry: true
        }
    });

    if (!user) {
        throw new Error(`User with ID ${userId} not found`);
    }

    if (!user.googleAccessToken || !user.googleRefreshToken) {
        throw new Error('Google account not connected for this user');
    }

    oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
        expiry_date: user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : undefined
    });

    return oauth2Client;
}

async function deleteCalendarById(calendarId, userId = null) {
    try {
        if (!userId) {
            console.log('No user ID provided. You must provide a user ID to authenticate with Google.');
            console.log('Usage: node src/scripts/deleteCalendarById.js [calendarId] [userId]');
            process.exit(1);
        }

        console.log(`Setting up OAuth client for user ${userId}...`);
        const auth = await setupOAuthClient(userId);

        console.log(`Calendar ID to delete: ${calendarId}`);

        // Create Calendar API client
        const calendar = google.calendar({ version: 'v3', auth });

        // First, verify the calendar exists
        try {
            console.log('Verifying calendar exists...');
            await calendar.calendars.get({ calendarId });
            console.log('Calendar exists, proceeding with deletion...');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('Calendar does not exist in Google Calendar');
                return;
            } else {
                throw error;
            }
        }

        // Delete the calendar
        try {
            await calendar.calendars.delete({ calendarId });
            console.log(`Successfully deleted calendar: ${calendarId}`);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('Calendar already deleted or not found');
            } else {
                throw error;
            }
        }

        // If userId is provided, check if we need to update the user record
        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { googleCalendarId: true }
            });

            if (user && user.googleCalendarId === calendarId) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { googleCalendarId: null }
                });
                console.log(`Cleared googleCalendarId for user ${userId}`);
            } else {
                console.log(`User ${userId} does not have this calendar ID stored, no update needed`);
            }
        }

        console.log('Calendar deletion process completed successfully');
    } catch (error) {
        console.error('Error deleting calendar:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Get arguments from command line
const calendarId = process.argv[2];
const userId = process.argv[3];

if (!calendarId) {
    console.error('Please provide a calendar ID as a command line argument');
    console.error('Usage: node src/scripts/deleteCalendarById.js [calendarId] [userId]');
    process.exit(1);
}

// Run the script
deleteCalendarById(calendarId, userId)
    .then(() => {
        console.log('Script execution completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('Script execution failed:', error);
        process.exit(1);
    });
