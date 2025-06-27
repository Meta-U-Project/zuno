const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../models/userService');

const register = async (req, res) => {
    const { email, password } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser(email, hashed);
    res.status(201).json({ message: 'User registered', user: { id: user.id, email: user.email } });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Logged in', user: { id: user.id, email: user.email } });
};

const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
};

module.exports = { register, login, logout };
