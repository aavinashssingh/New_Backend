const { Schema } = require("mongoose");
const { constants } = require("../utils/index");
const db = require("../config/database").getUserDB();

const userSchema = new Schema(
  {


    password: {
      type: String, 
    },
    
    fullName: {
      type: String,
      // required: true,
    },
    phone: {
      type: String,
      // required: true,
    },
    countryCode: {
      type: String,
      default: "+91",
    },
    // userType: {
    //   type: Number,
    //   enum: constants.USER_TYPES,
    //   default: constants.USER_TYPES.PATIENT,
    // },
    userType: [
      {
        type: Number,
        enum: constants.USER_TYPES,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Number,
      default: constants.PROFILE_STATUS.ACTIVE,
      enum: constants.PROFILE_STATUS,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = db.model("users", userSchema);

module.exports = {
  model: User,
};
