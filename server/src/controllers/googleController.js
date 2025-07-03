const { google } = require('googleapis');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

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

        // Check if Canvas is also connected
        const canvasConnected = !!updatedUser.canvasAccessToken;

        if (canvasConnected) {
            // Both integrations complete, redirect to dashboard
            res.redirect(`${process.env.CLIENT_URL}/dashboard?google=connected`);
        } else {
            // Still need Canvas, redirect to connect page
            res.redirect(`${process.env.CLIENT_URL}/connect?google=connected`);
        }
    } catch (error) {
        console.log("Google callback error:", error);
        res.status(500).send("Google OAuth Failed.");
    }
};

module.exports = {
    auth,
    callback
};
