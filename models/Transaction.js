const mongoose = require('mongoose');

// One record per customer per transfer. An intra-bank transfer produces two records:
// a debit for the sender and a credit for the recipient, each owned by that customer.
const transactionSchema = new mongoose.Schema({
    customer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true, 
        index: true 
    },
    reference: { 
        type: String, 
        required: true, 
        index: true 
    },
    direction: { 
        type: String, 
        enum: ['debit', 'credit'], 
        required: true 
    },
    transferType: { 
        type: String, 
        enum: ['intra-bank', 'inter-bank'], 
        required: true 
    },
    fromAccount: { 
        type: String, 
        required: true 
    },
    toAccount: { 
        type: String, 
        required: true 
    },
    counterpartyName: String,
    amount: { 
        type: Number, 
        required: true 
    },
    narration: String,
    status: { 
        type: String, 
        default: 'pending' 
    }
}, { timestamps: true });

transactionSchema.index({ customer: 1, reference: 1 }, { unique: true });

module.exports = mongoose.model('Transaction', transactionSchema);
