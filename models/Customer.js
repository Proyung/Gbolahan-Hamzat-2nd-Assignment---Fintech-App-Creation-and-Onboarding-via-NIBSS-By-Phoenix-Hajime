const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    firstName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    lastName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    phone: { 
        type: String, 
        trim: true 
    },
    dob: { 
        type: String, 
        required: true 
    },
    password: { 
        type: String, 
        required: true, 
        select: false 
    },

    // KYC: set once the customer's BVN or NIN has been created AND validated on NIBSS
    kycType: { 
        type: String, 
        enum: ['bvn', 'nin'] 
    },
    kycId: { 
        type: String, 
        select: false 
    },
    kycVerified: { 
        type: Boolean, 
        default: false 
    },
    kycVerifiedAt: Date
}, { timestamps: true });

customerSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.kycId;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Customer', customerSchema);
