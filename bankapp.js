require('dotenv').config();
const express = require('express');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const authRoute = require('./routes/authroute');
const onboardingRoute = require('./routes/onboardingroute');
const accountRoute = require('./routes/accountsroute');
const transferRoute = require('./routes/transferroute');

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Bank API is running' }));

app.use('/api/auth', authRoute);
app.use('/api/onboarding', onboardingRoute);
app.use('/api/accounts', accountRoute);
app.use('/api/transfers', transferRoute);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

//const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
});

