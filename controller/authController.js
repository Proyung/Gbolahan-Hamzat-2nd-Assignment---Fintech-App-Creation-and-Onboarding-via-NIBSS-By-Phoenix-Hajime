const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const AppError = require('../Utility/AppError');

const signToken = (customer) =>
    jwt.sign({ id: customer._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

// POST /api/auth/register
const register = async (req, res) => {
    const { firstName, lastName, email, phone, dob, password } = req.body;

    if (!firstName || !lastName || !email || !dob || !password) {
        throw new AppError('firstName, lastName, email, dob and password are required');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        throw new AppError('dob must be in YYYY-MM-DD format');
    }
    if (password.length < 6) {
        throw new AppError('password must be at least 6 characters');
    }

    const customer = await Customer.create({
        firstName,
        lastName,
        email,
        phone,
        dob,
        password: await bcrypt.hash(password, 10)
    });

    res.status(201).json({
        success: true,
        message: 'Registration successful. Complete BVN or NIN onboarding to open an account.',
        token: signToken(customer),
        customer
    });
};

// POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new AppError('email and password are required');
    }

    const customer = await Customer.findOne({ email: email.toLowerCase() }).select('+password');
    if (!customer || !(await bcrypt.compare(password, customer.password))) {
        throw new AppError('Invalid email or password', 401);
    }

    res.json({ success: true, token: signToken(customer), customer });
};

// GET /api/auth/me
const me = async (req, res) => {
    res.json({ success: true, customer: req.customer });
};

module.exports = { register, login, me };
