const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
    line1: {
        type: String,
        maxlength: 120,
        default: ''
    },
    city: {
        type: String,
        maxlength: 80,
        default: ''
    },
    state: {
        type: String,
        maxlength: 80,
        default: ''
    },
    country: {
        type: String,
        maxlength: 80,
        default: ''
    },
    postalCode: {
        type: String,
        maxlength: 20,
        default: ''
    }
}, { _id: false });

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function requiredPassword() {
            return !this.googleId;
        }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },
    phone: {
        type: String,
        maxlength: 20,
        default: null
    },
    address: {
        type: addressSchema,
        default: undefined
    },
    profilePictureUrl: {
        type: String,
        default: null
    },
    profilePicturePublicId: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otpHash: {
        type: String,
        default: null
    },
    otpPurpose: {
        type: String,
        enum: ['verify-email', 'reset-password', null],
        default: null
    },
    otpExpiresAt: {
        type: Date,
        default: null
    },
    otpSentAt: {
        type: Date,
        default: null
    },
    otpAttempts: {
        type: Number,
        default: 0,
        min: 0
    }
}, { timestamps: true, versionKey: false });

const User = mongoose.model('User', userSchema);

module.exports = User;
