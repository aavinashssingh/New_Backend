const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { Registration } = require("../../../models/index");
const { otpVerificationSchema } = require("./schema"); // Adjust the path accordingly
const { loginSchema } = require("./schema");
const httpStatus = require("http-status");
const { ObjectId } = require("mongoose").Types;
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
const {
  User,
  Doctor,
  OTP,
  Patient,
  Hospital,
  EstablishmentMaster,
  EstablishmentTiming,
  Session,
  ResetPassword,
} = require("../../../models/index");
const { bool } = require("joi");

const resetPassword = async (req, res) => {
  try {
    const { userId, Password, newPassword } = req.body;
    // let { userId } = req.data;


    const user = await common.getByCondition(User.model, {
      _id: new ObjectId(userId),
    });

    if (!user) {
      return response.error(
        { msgCode: "USER_NOT_FOUND" },
        res,
        httpStatus.NOT_FOUND
      );
    }

    let currentPasswordHash = comparePassword(Password, user.password);
    isPasswordValid = currentPasswordHash;

    if (!isPasswordValid) {
      return response.error(
        { msgCode: "INVALID_CURRENT_PASSWORD" },
        res,
        httpStatus.NOT_FOUND
      );
    }

    const hashedNewPassword = await generateHash(newPassword);

    const updatedUser = await User.model.findByIdAndUpdate(
      user,
      { password: hashedNewPassword },
      { new: true }
    );

    if (!updatedUser) {
      return response.error(
        { msgCode: "FAILED_TO_UPDATE_PASSWORD" },
        res,
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return response.success(
      { msgCode: "PASSWORD_RESET_SUCCESSFUL", data: updatedUser },
      res,
      httpStatus.OK
    );
  } catch (error) {
    console.error(`Error during password reset: ${error.message}`);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

module.exports = {
  resetPassword,
};
