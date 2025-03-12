const Joi = require("joi");
const { constants } = require("../../../utils/constant");

const registrationSchema = Joi.object({
    name: Joi.string().trim().min(1).required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    yearsOfExperience: Joi.string().trim().min(1).required(),
    education: Joi.string().trim().min(1).required(),
    city: Joi.string().trim().min(1).required(),
    phoneNumber: Joi.string().trim().min(1).required(),
    emailAddress: Joi.string().trim().email().required(),
    password: Joi.string().trim().min(6).required(),
    consent: Joi.boolean().valid(true).required(),
    isPhoneVerified: Joi.boolean()
});

const updateRegistrationSchema = Joi.object({
    name: Joi.string().trim().min(3).max(50),  // Optional during update
    gender: Joi.string().valid('male', 'female', 'other'),
    yearsOfExperience: Joi.string()
        .pattern(/^\d+$/)
        .messages({
            "string.pattern.base": "Years of experience must be a number.",
        }),
    education: Joi.string().trim().min(1).max(100),
    city: Joi.string().trim().min(1).max(50),
    phoneNumber: Joi.string()
        .pattern(/^\+?[0-9]{7,15}$/)
        .messages({
            "string.pattern.base": "Phone number must be valid.",
        }),
    emailAddress: Joi.string().email({ minDomainSegments: 2 }),
    password: Joi.string().trim().min(6).max(100),
    consent: Joi.boolean().valid(true),
    isPhoneVerified: Joi.boolean()
});


const otpVerificationSchema = Joi.object({
    phoneNumber: Joi.string().trim().min(1).required(),
    otp: Joi.string().trim().min(1).required()
});



// Joi schema for login
const loginSchema = Joi.object({
    phoneNumber: Joi.string().trim().min(10).required(),
    password: Joi.string().min(6).required(),
  });



  
const pwd =
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%#*?&])[A-Za-z\d@$!%*#?&]{8,25}$/;

const signUp = Joi.object().keys({
fullName: Joi.string().required(),
phone: Joi.string().length(10).pattern(constants.regexForMobile).required(),
userType: Joi.number().required(),
mode: Joi.number().optional(),
countryCode: Joi.string().trim().default("+91"),
experience:Joi.string().trim().min(1).required(),
gender:Joi.string().required(),
city:Joi.string().trim().min(1).required(),
specialization:Joi.string().required(),
email:Joi.string().trim().email().required(),
password:Joi.string().trim().min(6).required(),
education: Joi.array().items(
    Joi.object({
      degree: Joi.string().required(),
      college: Joi.string().required(),
      year: Joi.string().required(),
    })
  )
});

const login = Joi.object().keys({
phone: Joi.string().required(),
// phone: Joi.string().length(10).pattern(constants.regexForMobile).required(),
userType: Joi.number().required(),
mode: Joi.number().optional(),
countryCode: Joi.string().trim().default("+91"),
password: Joi.string().trim().min(6).required(),
email: Joi.string().trim().email().required(),
deviceId:Joi.string(),
deviceToken:Joi.string(),
deviceType:Joi.string(),
os:Joi.string(),
browser:Joi.string()
});

const verifyOTP = Joi.object().keys({
phone: Joi.string().length(10).pattern(constants.regexForMobile).required(),
userType: Joi.number().required(),
otp: Joi.string().required(),
mode: Joi.number().optional(),
countryCode: Joi.string().trim().default("+91"),
deviceId: Joi.string().trim().default(null),
deviceToken: Joi.string().trim().default(null),
deviceType: Joi.string().trim().default(constants.DEVICE_TYPE.DESKTOP),
browser: Joi.string().trim().default(null),
os: Joi.string().trim().default(null),
osVersion: Joi.string().trim().default(null),
});

module.exports = {
    signUp,
    login,
    verifyOTP

};
