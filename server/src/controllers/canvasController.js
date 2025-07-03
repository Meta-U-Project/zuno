const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const saveCanvasCredentials = async (req, res) => {
    const { domain, accessToken } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                canvasDomain: domain,
                canvasAccessToken: accessToken
            }
        });

        // Check if Google is also connected
        const googleConnected = !!updatedUser.googleAccessToken;

        res.status(200).json({
            message: 'Canvas credentials saved successfully',
            redirectToDashboard: googleConnected,
            integrations: {
                googleConnected,
                canvasConnected: true
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong saving credentials' });
    }
};

module.exports = { saveCanvasCredentials };
