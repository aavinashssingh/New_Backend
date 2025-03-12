const { Schema } = require("mongoose");
const db = require("../config/database").getUserDB();

const registrationSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: true,
        },
        yearsOfExperience: {
            type: String,
            required: true,
        },
        education: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        emailAddress: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        consent: {
            type: Boolean,
            required: true,
        },
        isPhoneVerified: {
            type: Boolean,
            required: false,
        }
    });


const Registration = db.model("Registration", registrationSchema);

module.exports = {
    model: Registration,
};
