const Account = require('../models/Account');
const Customer = require('../models/Customer');
const nibssService = require('../Services/nibssservice');
const AppError = require('../Utility/AppError');
const { unwrap, pick } = require('../Utility/helpers');


const getOwnAccount = async (customerId) => {
    const account = await Account.findOne({ customer: customerId });
    if (!account) {
        throw new AppError('You do not have an account yet', 404);
    }
    return account;
};


const createAccount = async (req, res) => {
    const customer = req.customer;


    if (!customer.kycVerified) {
        throw new AppError('Complete BVN or NIN onboarding before creating an account', 403);
    }


    if (await Account.exists({ customer: customer._id })) {
        throw new AppError('Customer already has an account', 409);
    }

    const { kycId } = await Customer.findById(customer._id).select('+kycId');
    const data = unwrap(await nibssService.createAccount(customer.kycType, kycId, customer.dob));

    const accountNumber = pick(data, 'accountNumber', 'account_number', 'accountNo');
    if (!accountNumber) {
        throw new AppError('NIBSS did not return an account number', 502);
    }

    const account = await Account.create({
        customer: customer._id,
        accountNumber: String(accountNumber),
        accountName: pick(data, 'accountName', 'name') || `${customer.firstName} ${customer.lastName}`,
        bankCode: data.bankCode
    });


    const balance = pick(unwrap(await nibssService.getBalance(account.accountNumber)), 'balance', 'availableBalance');

    res.status(201).json({
        success: true,
        message: 'Account created successfully',
        account: { ...account.toObject(), balance }
    });
};

// GET /api/accounts/me
const getMyAccount = async (req, res) => {
    const account = await getOwnAccount(req.customer._id);
    res.json({ success: true, account });
};

// GET /api/accounts/me/balance - balance of the logged-in customer's account only
const getMyBalance = async (req, res) => {
    const account = await getOwnAccount(req.customer._id);
    const data = unwrap(await nibssService.getBalance(account.accountNumber));

    res.json({
        success: true,
        accountNumber: account.accountNumber,
        balance: pick(data, 'balance', 'availableBalance')
    });
};

// GET /api/accounts/name-enquiry/:accountNumber - verify a recipient before transferring
const nameEnquiry = async (req, res) => {
    const { accountNumber } = req.params;
    if (!/^\d{10}$/.test(accountNumber)) {
        throw new AppError('accountNumber must be a 10-digit number');
    }

    const data = unwrap(await nibssService.nameEnquiry(accountNumber));


    res.json({
        success: true,
        accountNumber,
        accountName: pick(data, 'accountName', 'name'),
        bankCode: data.bankCode
    });
};

module.exports = { createAccount, getMyAccount, getMyBalance, nameEnquiry, getOwnAccount };
