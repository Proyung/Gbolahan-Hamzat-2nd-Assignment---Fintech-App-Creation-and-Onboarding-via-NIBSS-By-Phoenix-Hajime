const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const AppError = require('../Utility/AppError');

// Verifies the customer's JWT and attaches the customer to req.customer.
// Every protected controller reads the customer from here - never from the request body
// or URL - which is what keeps one customer from reaching another customer's data.
const protect = async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
        throw new AppError('Authentication required', 401);
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        throw new AppError('Invalid or expired token', 401);
    }

    const customer = await Customer.findById(payload.id);
    if (!customer) {
        throw new AppError('Customer no longer exists', 401);
    }

    req.customer = customer;
    next();
};

module.exports = { protect };
