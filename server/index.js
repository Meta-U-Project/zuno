const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

const googleRoutes = require('./src/routes/googleRoutes');
app.use('/api/google', googleRoutes);

const userRoutes = require('./src/routes/userRoutes');
app.use('/api/user', userRoutes);

const canvasRoutes = require('./src/routes/canvasRoutes');
app.use('/api/canvas', canvasRoutes);

const syncCanvasScheduler = require('./src/cron/syncCanvasScheduler')
syncCanvasScheduler();

const zunoScoreScheduler = require('./src/cron/zunoScoreScheduler')
zunoScoreScheduler();

const taskRoutes = require('./src/routes/taskRoutes');
app.use('/api/task', taskRoutes);

const noteRoutes = require('./src/routes/noteRoutes');
app.use('/api/notes', noteRoutes);

const analyticsRoutes = require('./src/routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);

const notificationRoutes = require('./src/routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Zuno backend running on port ${process.env.PORT}`);
});
