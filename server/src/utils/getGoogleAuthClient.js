const { google } = require("googleapis");
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const getGoogleAuthClient = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
        expiry_date: user.googleTokenExpiry?.getTime()
    });

    oauth2Client.on("tokens", async (tokens) => {
        if (tokens.refresh_token || tokens.access_token) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token ?? user.googleRefreshToken,
                googleTokenExpiry: tokens.expiry_date
                    ? new Date(tokens.expiry_date)
                    : null
                }
            });
        }
    });

    return oauth2Client;
};

module.exports = getGoogleAuthClient;
