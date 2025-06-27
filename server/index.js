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

app.listen(process.env.PORT, () => {
  console.log(`Zuno backend running on port ${process.env.PORT}`);
});


const userRoutes = require('./src/routes/userRoutes');
app.use('/api/user', userRoutes);
