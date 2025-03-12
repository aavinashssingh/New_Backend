const { Schema } = require("mongoose");
const db = require("../config/database").getUserDB();

const surgeryoverviewFaqSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    surgeryId: {
      type: Schema.Types.ObjectId,
      ref: "surgerymasters",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const SurgeryoveriewFaq = db.model("surgeryoverviewfaqs", surgeryoverviewFaqSchema);

module.exports = {
  model: SurgeryoveriewFaq,
};

//add by gurmeet