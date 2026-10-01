const nibssClient = require('../config/nibssconfig');

// ---------- Onboarding (KYC) ----------

const insertBvn = async ({ bvn, firstName, lastName, dob, phone }) => {
    const response = await nibssClient.post('/api/insertBvn', { bvn, firstName, lastName, dob, phone });
    return response.data;
};

const insertNin = async ({ nin, firstName, lastName, dob }) => {
    const response = await nibssClient.post('/api/insertNin', { nin, firstName, lastName, dob });
    return response.data;
};

const validateBvn = async (bvn) => {
    const response = await nibssClient.post('/api/validateBvn', { bvn });
    return response.data;
};

const validateNin = async (nin) => {
    const response = await nibssClient.post('/api/validateNin', { nin });
    return response.data;
};

// ---------- Accounts ----------

const createAccount = async (kycType, kycID, dob) => {
    const response = await nibssClient.post('/api/account/create', { kycType, kycID, dob });
    return response.data;
};

const nameEnquiry = async (accountNumber) => {
    const response = await nibssClient.get(`/api/account/name-enquiry/${accountNumber}`);
    return response.data;
};

const getBalance = async (accountNumber) => {
    const response = await nibssClient.get(`/api/account/balance/${accountNumber}`);
    return response.data;
};

// ---------- Transfers ----------

const transfer = async (from, to, amount) => {
    const response = await nibssClient.post('/api/transfer', { from, to, amount: String(amount) });
    return response.data;
};

const transactionStatus = async (reference) => {
    const response = await nibssClient.get(`/api/transaction/${reference}`);
    return response.data;
};

module.exports = {
    insertBvn,
    insertNin,
    validateBvn,
    validateNin,
    createAccount,
    nameEnquiry,
    getBalance,
    transfer,
    transactionStatus
};
