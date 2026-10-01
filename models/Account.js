const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    // unique: true enforces the "maximum of one account per customer" rule at DB level
    customer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true, 
        unique: true },
    accountNumber: { 
        type: String, 
        required: true, 
        unique: true 
    },
    accountName: { 
        type: String 
    },
    bankCode: { 
        type: String 
    }
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);
