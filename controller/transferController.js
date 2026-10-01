const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const nibssService = require('../Services/nibssservice');
const { getFintech } = require('../config/nibssconfig');
const AppError = require('../Utility/AppError');
const { unwrap, pick } = require('../Utility/helpers');
const { getOwnAccount } = require('./accountController');


const transfer = async (req, res) => {
    const { to, narration } = req.body;
    const amount = Number(req.body.amount);

    if (!to || !/^\d{10}$/.test(to)) {
        throw new AppError('to must be a 10-digit account number');
    }
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new AppError('amount must be a positive number');
    }

    const source = await getOwnAccount(req.customer._id);
    if (source.accountNumber === to) {
        throw new AppError('You cannot transfer to your own account');
    }

    // Name enquiry first: confirms the recipient exists before any money moves
    const recipient = unwrap(await nibssService.nameEnquiry(to));
    const recipientName = pick(recipient, 'accountName', 'name');

    // Pre-check balance to fail fast with a clear message
    const balance = Number(pick(unwrap(await nibssService.getBalance(source.accountNumber)), 'balance', 'availableBalance'));
    if (Number.isFinite(balance) && balance < amount) {
        throw new AppError('Insufficient funds', 422);
    }

    // Intra-bank if the recipient's bank code (from name enquiry) is our own, otherwise inter-bank
    const { bankCode } = await getFintech();
    const transferType = recipient.bankCode === bankCode ? 'intra-bank' : 'inter-bank';

    // Recipient is one of our app's customers - they get a credit record in their history
    const recipientAccount = await Account.findOne({ accountNumber: to });

    const result = unwrap(await nibssService.transfer(source.accountNumber, to, amount));
    const reference = pick(result, 'reference', 'transactionId', 'transactionRef', 'txRef', 'id');
    if (!reference) {
        throw new AppError('Transfer submitted but NIBSS returned no transaction reference', 502);
    }
    const status = String(pick(result, 'status') || 'successful').toLowerCase();

    const base = {
        reference: String(reference),
        transferType,
        fromAccount: source.accountNumber,
        toAccount: to,
        amount,
        narration,
        status
    };

    // Sender's debit record
    const debit = await Transaction.create({
        ...base,
        customer: req.customer._id,
        direction: 'debit',
        counterpartyName: recipientName
    });

    // Recipient's credit record, so intra-bank recipients see it in their own history
    if (recipientAccount) {
        await Transaction.create({
            ...base,
            customer: recipientAccount.customer,
            direction: 'credit',
            counterpartyName: source.accountName
        });
    }

    res.status(201).json({ success: true, message: 'Transfer successful', transaction: debit });
};

// GET /api/transfers/history - only the logged-in customer's own transactions
const history = async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const filter = { customer: req.customer._id };

    const [transactions, total] = await Promise.all([
        Transaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-customer -__v'),
        Transaction.countDocuments(filter)
    ]);

    res.json({ success: true, page, limit, total, transactions });
};

// GET /api/transfers/:reference/status - Transaction Status Query (TSQ)
// Only allowed for references that belong to the logged-in customer.
const transactionStatus = async (req, res) => {
    const transaction = await Transaction.findOne({ customer: req.customer._id, reference: req.params.reference });
    if (!transaction) {
        // Same 404 whether it doesn't exist or belongs to someone else - no information leak
        throw new AppError('Transaction not found', 404);
    }

    const data = unwrap(await nibssService.transactionStatus(transaction.reference));
    const status = pick(data, 'status');

    if (status && String(status).toLowerCase() !== transaction.status) {
        transaction.status = String(status).toLowerCase();
        await transaction.save();
    }

    res.json({
        success: true,
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount,
        direction: transaction.direction,
        transferType: transaction.transferType,
        createdAt: transaction.createdAt
    });
};

module.exports = { transfer, history, transactionStatus };
