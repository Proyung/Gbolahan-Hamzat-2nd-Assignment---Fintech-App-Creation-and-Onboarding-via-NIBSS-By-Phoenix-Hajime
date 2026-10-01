const nibssService = require('../Services/nibssservice');
const AppError = require('../Utility/AppError');
const { mask, unwrap } = require('../Utility/helpers');


const onboard = (kycType) => async (req, res) => {
    const customer = req.customer;
    const kycId = req.body[kycType];

    if (!kycId || !/^\d{11}$/.test(kycId)) {
        throw new AppError(`${kycType} must be an 11-digit number`);
    }
    if (customer.kycVerified) {
        throw new AppError(`Customer is already verified with ${customer.kycType.toUpperCase()}`, 409);
    }

    if (kycType === 'bvn' && !customer.phone) {
        throw new AppError('Add a phone number to your profile before BVN onboarding');
    }

    const identity = {
        [kycType]: kycId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        dob: customer.dob
    };

    if (kycType === 'bvn') {
        await nibssService.insertBvn({ ...identity, phone: customer.phone });
    } else {
        await nibssService.insertNin(identity);
    }

    const validation = unwrap(kycType === 'bvn'
        ? await nibssService.validateBvn(kycId)
        : await nibssService.validateNin(kycId));

    const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
    const matches = same(validation.firstName, customer.firstName)
        && same(validation.lastName, customer.lastName)
        && String(validation.dob || '').slice(0, 10) === customer.dob;
    if (!matches) {
        throw new AppError(`${kycType.toUpperCase()} details do not match your profile`, 422);
    }

    customer.kycType = kycType;
    customer.kycId = kycId;
    customer.kycVerified = true;
    customer.kycVerifiedAt = new Date();
    await customer.save();

    res.status(201).json({
        success: true,
        message: `${kycType.toUpperCase()} created and verified. You can now open an account.`,
        kycType,
        kycId: mask(kycId)
    });
};

module.exports = {
    onboardBvn: onboard('bvn'),
    onboardNin: onboard('nin')
};
