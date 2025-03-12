const { Schema } = require("mongoose");
const db = require("../config/database").getUserDB();

const socialMediaSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const SocialMedia = db.model("socialMedia", socialMediaSchema);

module.exports = {
  model: SocialMedia,
};
