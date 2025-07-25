/**
 * Script to delete a specific Google Calendar and clear the googleCalendarId from the user's record
 *
 * Usage:
 * 1. Make sure you have the correct .env file with Google OAuth credentials
 * 2. Run with: node src/scripts/deleteCalendar.js [userId]
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
            googleTokenExpiry: true,
            googleCalendarId: true
        }
    });

    if (!user) {
        throw new Error(`User with ID ${userId} not found`);
    }

    if (!user.googleAccessToken || !user.googleRefreshToken) {
        throw new Error('Google account not connected for this user');
    }

    if (!user.googleCalendarId) {
        throw new Error('No Google Calendar ID found for this user');
    }

    oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
        expiry_date: user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : undefined
    });

    return { oauth2Client, calendarId: user.googleCalendarId };
}

async function deleteCalendar(userId) {
    try {
        console.log(`Setting up OAuth client for user ${userId}...`);
        const { oauth2Client, calendarId } = await setupOAuthClient(userId);

        console.log(`Calendar ID to delete: ${calendarId}`);

        // Create Calendar API client
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // First, verify the calendar exists
        try {
            console.log('Verifying calendar exists...');
            await calendar.calendars.get({ calendarId });
            console.log('Calendar exists, proceeding with deletion...');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('Calendar does not exist in Google Calendar');
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

        // Update user record to clear the googleCalendarId
        await prisma.user.update({
            where: { id: userId },
            data: { googleCalendarId: null }
        });
        console.log(`Cleared googleCalendarId for user ${userId}`);

        console.log('Calendar deletion process completed successfully');
    } catch (error) {
        console.error('Error deleting calendar:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Get userId from command line arguments
const userId = process.argv[2];

if (!userId) {
    console.error('Please provide a user ID as a command line argument');
    console.error('Usage: node src/scripts/deleteCalendar.js [userId]');
    process.exit(1);
}

// Run the script
deleteCalendar(userId)
    .then(() => {
        console.log('Script execution completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('Script execution failed:', error);
        process.exit(1);
    });
