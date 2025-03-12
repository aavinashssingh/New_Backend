const { Schema } = require("mongoose");
const db = require("../config/database").getUserDB();

const resetPasswordSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users", // reference the users collection,
    default: null,
  },
  password: {
    type: String,
    required: true,
  },
  newPassword: {
    type: String,
    required: true,
  },
});

const ResetPassword = db.model("resetPassword", resetPasswordSchema);

module.exports = {
  model: ResetPassword,
};
