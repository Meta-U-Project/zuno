const jwt = require('jsonwebtoken');
const {createTransport} = require('nodemailer');
const jwtSecret = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

const verifyResetToken = (user, token) => {
    const secret = user.password;
    try {
        jwt.verify(token, secret);
        return true;
        } catch (err) {
        console.error('Token verification error:', err.message);
        return false;
        }
};


const createPasswordResetToken = ({_id, email, password}) => {
    const secret = password;
    return jwt.sign({id: _id, email}, secret, {
        expiresIn: '1h', // 15 minutes
    });
};



const createPasswordResetUrl = (id, token) =>
    `${process.env.CLIENT_URL}/reset-password/${id}/${token}`;


console.log(process.env.EMAIL_USER);
console.log(process.env.EMAIL_PASS);
const transporter = createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const passwordResetTemplate = (user, url) => {
    const { username, email } = user;
    return {
        from: `Mail - <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Reset Password`,
        html: `
            <h2>Password Reset Link</h2>
            <p>Reset your password by clicking on the link below:</p>
            <a href=${url}><button>Reset Password</button></a>
            <br />
            <br />
            <small><a style="color: #38A169" href=${url}>${url}</a></small>
            <br />
            <small>The link will expire in 15 mins!</small>
            <small>If you haven't requested password reset, please ignore!</small>
            <br /><br />
            <p>Thanks,</p>
            <p>Authentication API</p>`,
    };
};

const passwordResetConfirmationTemplate = (user) => {
    const { email } = user;
    return {
        from: `Mail - <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Password Reset Successful`,
        html: `
            <h2>Password Reset Successful</h2>
            <p>You've successfully updated your password for your account <${email}>. </p>
            <small>If you did not change your password, reset it from your account.</small>
            <br /><br />
            <p>Thanks,</p>
            <p>Authentication API</p>`,
        };
};

module.exports = {
    verifyToken,
    createPasswordResetToken,
    createPasswordResetUrl,
    transporter,
    passwordResetTemplate,
    passwordResetConfirmationTemplate,
    verifyResetToken,
};
