// Central error handler. Express 5 forwards errors thrown in async handlers here automatically.
const errorHandler = (err, req, res, next) => {
    // Errors from the NIBSS API (axios): surface the upstream status and message only
    if (err.isAxiosError) {
        const status = err.response?.status || 502;
        const message = err.response?.data?.message || 'NIBSS service unavailable, please try again';
        console.error(`NIBSS ${err.config?.method?.toUpperCase()} ${err.config?.url} -> ${status}: ${message}`);
        return res.status(status).json({ success: false, message });
    }

    // Duplicate key from MongoDB (e.g. email already registered)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(409).json({ success: false, message: `${field} already exists` });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: err.message });
    }

    const status = err.statusCode || 500;
    if (status === 500) console.error(err);
    res.status(status).json({ success: false, message: status === 500 ? 'Internal server error' : err.message });
};

module.exports = errorHandler;
