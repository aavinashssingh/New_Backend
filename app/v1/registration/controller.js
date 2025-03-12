const mongoose = require("mongoose");
const { Registration } = require("../../../models/index");
const { otpVerificationSchema } = require('./schema'); // Adjust the path accordingly
const { loginSchema } = require('./schema'); 
const httpStatus = require("http-status");

const {
  response,
  generateOtp,
  sendSms,
  generateHash,
  comparePassword,
  sendEmail,
} = require("../../../utils/index");
const { users, common } = require("../../../services/index");

const { generateAuthJwt } = require("../../../middlewares/index");
const config = require("../../../config/index");
const { constants } = require("../../../utils/constant");
const registration = require("../../../models/registration");
const environment = config.ENVIRONMENT === constants.SERVER.PROD;

const masterDoctorPassword = config.masterDoctorPassword;


const {
User,
Doctor,
OTP,
Patient,
Hospital,
EstablishmentMaster,
EstablishmentTiming,
Session,
} = require("../../../models/index");
const { Types } = require("mongoose");
const { ObjectId } = require("mongoose").Types;




const createRegistration = async (req, res) => {
  try {
    const { fullName, phone,specialization,education, userType, countryCode,experience,gender,city,email,password } = req.body;
    const lowercaseEmail=email.toLowerCase();

    const findUser = await users.findUser(
      phone.replace(/[-\s]/g, ""),
      countryCode,
      userType
    );
    
    if (findUser) {
      return response.error(
        { msgCode: "ALREADY_REGISTERED" },  
        res,
        httpStatus.FORBIDDEN
      );
    }
    const findExistingDoctor = await users.findDoctor(
      lowercaseEmail
    );

    if (findExistingDoctor) {
      return response.error(
        { msgCode: "ALREADY_REGISTERED_EMAIL" },  
        res,
        httpStatus.FORBIDDEN
      );
    }

    const hashedPassword =await generateHash(password); 
    

    let data;
      const profile = {
        fullName,
        phone: phone?.replace(/[-\s]/g, ""),
        countryCode,
        userType,
        password:hashedPassword
      };
      data = await common.create(User.model, profile);
     

      
      const doctor= await common.create(Doctor.model, {
        userId: new Types.ObjectId(data._id),
        gender: gender === 'male' ? 1 : gender === 'female' ? 2 : 3,
        city:city,
        email:lowercaseEmail,
        experience:experience,
        specialization:specialization,
        education:education

      }); 
     console.log(doctor)

    if (!data) {
      return response.error(
        { msgCode: "FAILED_TO_ADD" },
        res,
        httpStatus.FORBIDDEN
      );
    }
    const token = generateAuthJwt({
      userId: data._id,
      expiresIn: config.expireIn,
      userType,
      fullName
    })



    
    const otp = environment
      ? generateOtp(config.DEFAULT_OTP_LENGTH)
      : config.DEFAULT_OTP;
    const hashOtp = await generateHash(otp);
    const savedOtp = await common.create(OTP.model, {
      otp: hashOtp,
      phone: phone?.replace(/[-\s]/g, ""),
      userType,
    });
    if (!savedOtp) {
      return response.error(
        { msgCode: "FAILED_TO_CREATE_OTP" },
        res,
        httpStatus.FORBIDDEN
      );
    }
    if (environment) {
      const sendOtp = await sendSms.sendOtp(
        phone,
        countryCode,
        { OTP: otp },
        constants.SMS_TEMPLATES.OTP
      );
      if (!sendOtp)
        return response.error(
          { msgCode: "OTP_NOT_SENT", data: {} },
          res,
          httpStatus.FORBIDDEN
        );
    }
    return response.success(
      { msgCode: "SIGNUP_SUCCESSFUL", data: { token, data } },
      res,
      httpStatus.CREATED
    );
  } catch (error) {
    console.log(error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};




const changeNumberOtp = async (req, res) => {
  const { phone, userType, countryCode } = req.body;
  const formattedPhone = phone.replace(/[-\s]/g, "");

  const findUser = await users.findUser(formattedPhone, countryCode, userType);
  if (findUser) {
    return response.error(
      { msgCode: "EXISTING_PHONE_NUMBER" },
      res,
      httpStatus.CONFLICT
    );
  }

  try {
    const findUserOTP = await common.findObject(OTP.model, {
      phone: formattedPhone,
      userType,
    });

    await common.removeById(OTP.model, findUserOTP?._id); // Remove any existing otp
    const otp = environment ? generateOtp(config.DEFAULT_OTP_LENGTH) : config.DEFAULT_OTP;

    const hashOtp = await generateHash(otp);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
    const savedOtp = await common.create(OTP.model, {
      otp: hashOtp,
      phone: formattedPhone,
      userType,
      expiresAt,
    });

    

    if (!savedOtp) {
      return response.error(
        { msgCode: "FAILED_TO_CREATE_OTP" },
        res,
        httpStatus.FORBIDDEN
      );
    }


    if (environment) {
      const sendOtp = await sendSms.sendOtp(
        phone,
        countryCode,
        { OTP: otp },
        constants.SMS_TEMPLATES.OTP
      );
      if (!sendOtp) {
        return response.error(
          { msgCode: "OTP_NOT_SENT" },
          res,
          httpStatus.FORBIDDEN
        );
      }
    }



    return response.success(
      { msgCode: "OTP_SENT" },
      res,
      httpStatus.CREATED
    );
  } catch (error) {
    console.log('Error in changeNumberOtp:', error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};


const forgetPassword = async (req, res) => {


  try {
    const { phone, userType, countryCode } = req.body;
    const formattedPhone = phone.replace(/[-\s]/g, "");
  
    const findUser = await users.findUser(formattedPhone, countryCode, userType);
    if (findUser===null ) {
      return response.error(
        { msgCode: "NON_EXISTING_PHONE_NUMBER" },
        res,
        httpStatus.NOT_FOUND
      );
    }
    const findUserOTP = await common.findObject(OTP.model, {
      phone: formattedPhone,
      userType,
    });

    await common.removeById(OTP.model, findUserOTP?._id); // Remove any existing otp
    const otp = environment ? generateOtp(config.DEFAULT_OTP_LENGTH) : config.DEFAULT_OTP;

    const hashOtp = await generateHash(otp);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
    const savedOtp = await common.create(OTP.model, {
      otp: hashOtp,
      phone: formattedPhone,
      userType,
      expiresAt,
    });

    

    if (!savedOtp) {
      return response.error(
        { msgCode: "FAILED_TO_CREATE_OTP" },
        res,
        httpStatus.FORBIDDEN
      );
    }


    if (environment) {
      const sendOtp = await sendSms.sendOtp(
        phone,
        countryCode,
        { OTP: otp },
        constants.SMS_TEMPLATES.OTP
      );
      if (!sendOtp) {
        return response.error(
          { msgCode: "OTP_NOT_SENT" },
          res,
          httpStatus.FORBIDDEN
        );
      }
    }

    const userId=findUser._id

    return response.success(
      { msgCode: "OTP_SENT" ,data: { userId:userId }},
      res,
      httpStatus.CREATED
    );
  } catch (error) {
    console.log('Error in changeNumberOtp:', error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};





const changeNumberVerifyOtp = async (req, res) => {
  try {
    const { phone, userType, otp,userId } = req.body;
    const user = await common.getByCondition(User.model, {
      _id: new ObjectId(userId),
    });


    const formattedPhone = phone?.replace(/[-\s]/g, "");

    const findUserOTP = await common.findObject(OTP.model, {
      phone: formattedPhone,
      userType,
    });


    if (!findUserOTP) {
      return response.error(
        { msgCode: "INVALID_OTP" },
        res,
        httpStatus.FORBIDDEN
      );
    }


    const otpValid = comparePassword(otp, findUserOTP?.otp);
    


    if (!otpValid) {
      return response.error(
        { msgCode: "INVALID_OTP" },
        res,
        httpStatus.NOT_ACCEPTABLE
      );
    }

    if (new Date(findUserOTP?.expiresAt).getTime() < Date.now()) {
      return response.error(
        { msgCode: "EXPIRED_OTP" },
        res,
        httpStatus.NOT_ACCEPTABLE
      );
    }

  
    
const updateResult = await User.model.findByIdAndUpdate(
  user,
  { phone: formattedPhone },
  { new: true }
);

    await common.removeById(OTP.model, findUserOTP?._id); // Remove OTP after successful verification

    if (updateResult) {
      return response.success(
        { msgCode: "OTP_VERIFIED", data: { updateResult } },
        res,
        httpStatus.ACCEPTED
      );
    }
    else{
      return response.error(
        { msgCode: "INTERNAL_SERVER_ERROR" },
        res,
        httpStatus.INTERNAL_SERVER_ERROR
      );

    }

  } catch (error) {
    console.log('Error in verififing otp:', error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};


const changePasswordForgetPhone = async (req, res) => {
  try {
    const { password,userId } = req.body;
    const user = await common.getByCondition(User.model, {
      _id: new ObjectId(userId),
    });


    const hashedPassword =await generateHash(password); 
          
    
const updateResult = await User.model.findByIdAndUpdate(
  user,
  { password: hashedPassword },
  { new: true }
);


    if (updateResult) {
      return response.success(
        { msgCode: "PASSWORD_UPDATED", data: { updateResult } },
        res,
        httpStatus.ACCEPTED
      );
    }

    else{
      return response.error(
        { msgCode: "FAILED_TO_UPDATE_PASSWORD" },
        res,
        httpStatus.BAD_REQUEST
      );

    }

  } catch (error) {
    console.log('Error in updating phone:', error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};


const verifyForgetPhone = async (req, res) => {
  try {
    const { phone, userType, otp } = req.body;
    


    const formattedPhone = phone?.replace(/[-\s]/g, "");

    const findUserOTP = await common.findObject(OTP.model, {
      phone: formattedPhone,
      userType,
    });


    if (!findUserOTP) {
      return response.error(
        { msgCode: "INVALID_OTP" },
        res,
        httpStatus.FORBIDDEN
      );
    }

    

    const otpValid = comparePassword(otp, findUserOTP?.otp);


    if (!otpValid) {
      return response.error(
        { msgCode: "INVALID_OTP" },
        res,
        httpStatus.NOT_ACCEPTABLE
      );
    }

    if (new Date(findUserOTP?.expiresAt).getTime() < Date.now()) {
      return response.error(
        { msgCode: "EXPIRED_OTP" },
        res,
        httpStatus.NOT_ACCEPTABLE
      );
    }



    await common.removeById(OTP.model, findUserOTP?._id); // Remove OTP after successful verification

    if (otpValid) {
      return response.success(
        { msgCode: "OTP_VERIFIED",  },
        res,
        httpStatus.ACCEPTED
      );
    }
    else{
      return response.error(
        { msgCode: "INTERNAL_SERVER_ERROR" },
        res,
        httpStatus.INTERNAL_SERVER_ERROR
      );

    }

  } catch (error) {
    console.log('Error in changeNumberVerifyOtp:', error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};


const verifyOtp = async (req, res) => {
  try {
    const {
      phone,
      otp,
      userType,
      countryCode,
      deviceId,
      deviceType,
      deviceToken,
      browser,
      os,
      osVersion,
    } = req.body;
    //find user
    const findUser = await users.findUser(
      phone.replace(/[-\s]/g, ""),
      countryCode,
      userType
    );
    const findUserOTP = await common.findObject(OTP.model, {
      phone: phone?.replace(/[-\s]/g, ""),
      userType,
    });
    if (!findUser) {
      return response.success(
        { msgCode: "USER_NOT_FOUND" },
        res,
        httpStatus.NOT_FOUND
      );
    }
    if (!findUserOTP) {
      return response.error(
        { msgCode: "INVALID_OTP" },
        res,
        httpStatus.FORBIDDEN
      );
    }



    const check =   comparePassword(otp, findUserOTP?.otp);



    //verify otp

    if (!check) {
      return response.error(
        { msgCode: "INVALID_OTP" },
        res,
        httpStatus.NOT_ACCEPTABLE
      );
    }
    if (check && new Date(findUserOTP?.expiresAt).getTime() < Date.now()) {
      return response.error(
        { msgCode: "EXPIRED_OTP" },
        res,
        httpStatus.NOT_ACCEPTABLE
      );
    }
    //empty otp field by updating
    const model = {
      1: Patient.model,
      2: Doctor.model,
      3: Hospital.model,
    };
    const result = await common.getByCondition(model[userType], {
      userId: new ObjectId(findUser?._id),
    });
    const establishmentMasterData =
      (await common.getByCondition(EstablishmentMaster.model, {
        hospitalId: new ObjectId(result?._id),
      })) || null;
    const hospitalTiming =
      (await common.getByCondition(EstablishmentTiming.model, {
        establishmentId: new ObjectId(establishmentMasterData?._id),
        doctorId: { $exists: false },
      })) || null;
    const { steps, isVerified, profileScreen, profilePic } = result || {
      steps: null,
      isVerified: null,
      profileScreen: null,
      profilePic: null,
    };
    const name = establishmentMasterData?.name || null;

    findUser.name =
      userType === constants.USER_TYPES.HOSPITAL ? name : findUser?.fullName;

    const token = generateAuthJwt({
      userId: findUser?._id,
      userType,
      expiresIn: config?.expireIn,
      deviceId,
      deviceType,
      deviceToken,
      browser,
      os,
      osVersion,
      tokenType: constants.TOKEN_TYPE.LOGIN,
      fullName: findUser?.name
    });
    await common.create(Session.model, {
      jwt: token,
      userId: findUser?._id,
      deviceId,
      deviceType,
      deviceToken,
      browser,
      os,
      osVersion,
      tokenType: constants.TOKEN_TYPE.LOGIN,
    }); // Removing OTP
    await common.removeById(OTP.model, findUserOTP?._id); // Removing OTP
    findUser.profilePic = profilePic;
    return response.success(
      {
        msgCode: "OTP_VERIFIED",
        data: {
          token,
          findUser,
          steps,
          profileScreen,
          profilePic,
          approvalStatus: isVerified,
          doctorId: result?._id || null,
          establishmentName: name,
          hospitalTiming,
          userType,
        },
      },
      res,
      httpStatus.ACCEPTED
    );
  } catch (error) {
    console.log(error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};
const loginUser = async (req, res) => {
  try {
    const { phone, password,userType,countryCode,email,
      deviceId,
      deviceType,
      deviceToken,
      browser,
      os,
      osVersion,
      
     } = req.body;

    // Find user by phone number
let user
    if(email!='null@gmail.com'){
      const lowerCaseEmail = email.toLowerCase();
      const result = await common.getByCondition(Doctor.model, {
        email: lowerCaseEmail,
      }); 
     
      
      user = await users.findUserById(
           result?.userId,
      )
      }


      if(phone!='null'){
        user = await users.findUser(
          phone.replace(/[-\s]/g, ""),
          countryCode,
          userType
        )
      }

      
    if (
      !user ||
      user.isDeleted === true ||
      user.status === constants.PROFILE_STATUS.DEACTIVATE
    ) {
      return response.success(
        { msgCode: "USER_NOT_FOUND" },
        res,
        httpStatus.NOT_FOUND
      );
    }
    



    const userData = await common.getByCondition(Doctor.model, {
      userId: new ObjectId(user._id),
    });
  
    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
        passwordMatchMaster = await comparePassword(password, masterDoctorPassword);
      if(!passwordMatchMaster){
        return response.error({ msgCode: "INVALID_CREDENTIALS" }, res, httpStatus.UNAUTHORIZED);

      }

 
    }

    // const token = generateAuthJwt({
    //   userId: userData?._id,
    //   userType:2,
    //   expiresIn: config?.expireIn,
    //   deviceId:deviceId,
    //   deviceType:deviceType,
    //   deviceToken:deviceToken,
    //   browser:browser,
    //   os:os,
    //   osVersion:osVersion,
    //   tokenType: constants.TOKEN_TYPE.LOGIN,
    //   fullName: user?.fullName
    // });
    // console.log('testing',userData?._id)
    // console.log('testing',user?.fullName)




    // const token = generateAuthJwt({
    //   userId: userData?._id,
    //   expiresIn: config.expireIn,
    //   userType,
    //   fullName: user?.fullName
    // });
const token = generateAuthJwt({
  userId: user._id,
      userType,
      expiresIn: config?.expireIn,
      deviceId,
      deviceType,
      deviceToken,
      browser,
      os,
      osVersion,
      tokenType: constants.TOKEN_TYPE.LOGIN,
      fullName: user?.fullName
    });
   
const result = await common.getByCondition(Doctor.model, {
userId: new ObjectId(user?._id),
});
const establishmentMasterData =
(await common.getByCondition(EstablishmentMaster.model, {
  hospitalId: new ObjectId(result?._id),
})) || null;
const hospitalTiming =
(await common.getByCondition(EstablishmentTiming.model, {
  establishmentId: new ObjectId(establishmentMasterData?._id),
  doctorId: { $exists: false },
})) || null;
const { steps, isVerified, profileScreen, profilePic } = result || {
steps: null,
isVerified: null,
profileScreen: null,
profilePic: null,
};
const name = establishmentMasterData?.name || null;


    // await common.create(Session.model, {
    //   jwt: token,
    //   userId: userData?._id,
    //   deviceId :deviceId,
    //   deviceType:deviceType,
    //   deviceToken:deviceToken,
    //   browser:browser,
    //   os:os,
    //   osVersion:osVersion,
    //   tokenType: constants.TOKEN_TYPE.LOGIN,
    // });
    await common.create(Session.model, {
      jwt: token,
      userId: user._id,
      deviceId,
      deviceType,
      deviceToken,
      browser,
      os,
      osVersion,
      tokenType: constants.TOKEN_TYPE.LOGIN,
    });


    // Generate JWT token
    
    return response.success(
      {
        msgCode: "LOGIN_SUCCESSFUL",
        data: {
          token,
          user,
          steps,
          profileScreen,
          profilePic,
          approvalStatus: isVerified,
          doctorId: result?._id || null,
          establishmentName: name,
          hospitalTiming,
          userType,
        },
      },
      res,
      httpStatus.OK
    );
  } catch (error) {
    console.error(`Error during login process: ${error.message}`); // Log detailed error message
    return response.error({ msgCode: "INTERNAL_SERVER_ERROR" }, res, httpStatus.INTERNAL_SERVER_ERROR);
  }
};










// Get a registration by ID
const getRegistrationById = async (req, res) => {
try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.error(
            { msgCode: "INVALID_REGISTRATION_ID" },
            res,
            httpStatus.BAD_REQUEST
        );
    }

    const registration = await Registration.model.findById(id);
    if (!registration) {
        return response.error(
            { msgCode: "REGISTRATION_NOT_FOUND" },
            res,
            httpStatus.NOT_FOUND
        );
    }

    return response.success(
        { msgCode: "REGISTRATION_FOUND", data: registration },
        res,
        httpStatus.OK
    );
} catch (error) {
    console.error(error);
    return response.error(
        { msgCode: "SOMETHING_WENT_WRONG" },
        res,
        httpStatus.INTERNAL_SERVER_ERROR
    );
}
};


// Update a registration by ID
const updateRegistration = async (req, res) => {
try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.error(
            { msgCode: "INVALID_REGISTRATION_ID" },
            res,
            httpStatus.BAD_REQUEST
        );
    }

    const updatedRegistration = await Registration.model.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedRegistration) {
        return response.error(
            { msgCode: "REGISTRATION_NOT_FOUND" },
            res,
            httpStatus.NOT_FOUND
        );
    }

    return response.success(
        { msgCode: "REGISTRATION_UPDATED", data: updatedRegistration },
        res,
        httpStatus.OK
    );
} catch (error) {
    console.error(error);
    return response.error(
        { msgCode: "SOMETHING_WENT_WRONG" },
        res,
        httpStatus.INTERNAL_SERVER_ERROR
    );
}
};

// Delete a registration by ID
const deleteRegistration = async (req, res) => {
try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.error(
            { msgCode: "INVALID_REGISTRATION_ID" },
            res,
            httpStatus.BAD_REQUEST
        );
    }

    const deletedRegistration = await Registration.model.findByIdAndDelete(id);

    if (!deletedRegistration) {
        return response.error(
            { msgCode: "REGISTRATION_NOT_FOUND" },
            res,
            httpStatus.NOT_FOUND
        );
    }

    return response.success(
        { msgCode: "REGISTRATION_DELETED", data: deletedRegistration },
        res,
        httpStatus.OK
    );
} catch (error) {
    console.error(error);
    return response.error(
        { msgCode: "SOMETHING_WENT_WRONG" },
        res,
        httpStatus.INTERNAL_SERVER_ERROR
    );
}
};

// Get all registrations
const getAllRegistrations = async (req, res) => {
try {
    const registrations = await Registration.model.find();
    if (!registrations.length) {
        return response.error(
            { msgCode: "NO_REGISTRATIONS_FOUND" },
            res,
            httpStatus.NOT_FOUND
        );
    }

    return response.success(
        { msgCode: "REGISTRATIONS_FOUND", data: registrations },
        res,
        httpStatus.OK
    );
} catch (error) {
    console.error(error);
    return response.error(
        { msgCode: "SOMETHING_WENT_WRONG" },
        res,
        httpStatus.INTERNAL_SERVER_ERROR
    );
}
};

module.exports = {
createRegistration,
getRegistrationById,
updateRegistration,
deleteRegistration,
getAllRegistrations,
verifyOtp,
loginUser,
changeNumberOtp,
changeNumberVerifyOtp,
verifyForgetPhone,
forgetPassword,
changePasswordForgetPhone
};