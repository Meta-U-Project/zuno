const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const { createUser, findUserByEmail } = require('../models/userService');
const {createPasswordResetToken, createPasswordResetUrl, transporter, passwordResetTemplate, passwordResetConfirmationTemplate, verifyResetToken} = require('../middleware/authMiddleware');

const register = async (req, res) => {
    const { firstName, lastName, email, phone, school, password } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser(firstName, lastName, email, phone, school, hashed);
    res.status(201).json({
        message: 'User registered',
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        }
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: ' tials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Logged in', user: { id: user.id, email: user.email } });
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await findUserByEmail(email);
        if (!user) return res.status(400).json({ message: 'Email not found' });

        const token = createPasswordResetToken({ _id: user.id, email: user.email, password: user.password });
        const url = createPasswordResetUrl(user.id, token);
        const mailOptions = passwordResetTemplate({ username: user.firstName, email: user.email }, url);
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Error sending email' });
            }
            return res.json({ message: 'Password reset link has been successfully sent to your email!', type: 'success' });
        });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        return res.status(500).json({ message: 'Error sending email' });
    }
};


const resetPassword = async (req, res) => {
    try {
        console.log('Incoming reset request...');
        const { id, token } = req.params;
        const { newPassword } = req.body;
        console.log('Params:', id, token);
        console.log('New password:', newPassword);

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(400).json({ message: 'User not found' });

        console.log('User found:', user.email);

        const isValid = verifyResetToken(user, token);
        if (!isValid) return res.status(401).json({ message: 'Invalid or expired token' });

        const hashed = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id },
            data: { password: hashed },
        });

        console.log('Password updated. Sending confirmation email...');

        const mailOptions = passwordResetConfirmationTemplate(user);

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
            console.error('Email error:', error);
            return res.status(500).json({ message: 'Error sending confirmation email' });
            }

            console.log('Confirmation email sent:', info.response);
            return res.json({ message: 'Password reset successfully!', type: 'success' });
        });

        } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ message: 'Something went wrong' });
        }
    };

const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    logout
};
