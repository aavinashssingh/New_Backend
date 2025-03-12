const { Schema } = require("mongoose");
const db = require("../config/database").getUserDB();

const loginSchema = new Schema(
    {
        phoneNumber: {
            type: String,
            required: true,
            unique: true
          },
          email: {
            type: String,
            unique: true
          },
          password: {
            type: String,
            required: true
          }
    });


const Login = db.model("login", loginSchema);

module.exports = {
    model: Login,
};

