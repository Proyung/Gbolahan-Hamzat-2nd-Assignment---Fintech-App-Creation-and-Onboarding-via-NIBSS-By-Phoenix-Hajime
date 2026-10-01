const axios = require('axios');
const jwt = require('jsonwebtoken');

const nibssClient = axios.create({
    baseURL: process.env.NIBSS_BASE_URL, // Base URL from .env
    timeout: 15000, // Render free instances cold-start slowly
    headers: {
        'Content-Type': 'application/json'
    }
});


let cachedToken = null;
let tokenExpiresAt = 0;
let fintech = null; 

const fetchToken = async () => {
    // Plain axios call so this request doesn't go through the interceptor below
    const response = await axios.post(`${process.env.NIBSS_BASE_URL}/api/auth/token`, {
        apiKey: process.env.NIBSS_API_KEY,
        apiSecret: process.env.NIBSS_API_SECRET
    }, { timeout: 15000 });

    const { token, fintech: details } = response.data;
    if (!token) {
        throw new Error('NIBSS auth response did not contain a token');
    }

    // Use the JWT's own expiry when available, otherwise assume 30 minutes
    const decoded = jwt.decode(token);
    tokenExpiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + 30 * 60 * 1000;
    cachedToken = token;
    fintech = details || fintech;
    return token;
};

const getToken = async () => {
    const oneMinute = 60 * 1000;
    if (cachedToken && Date.now() < tokenExpiresAt - oneMinute) {
        return cachedToken;
    }
    return fetchToken();
};

// Attach the bearer token to every NIBSS request
nibssClient.interceptors.request.use(async (config) => {
    config.headers.Authorization = `Bearer ${await getToken()}`;
    return config;
});


nibssClient.interceptors.response.use(null, async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retried) {
        original._retried = true;
        cachedToken = null;
        return nibssClient(original);
    }
    return Promise.reject(error);
});


const getFintech = async () => {
    if (!fintech) await getToken();
    return fintech;
};

module.exports = nibssClient;
module.exports.getFintech = getFintech;
