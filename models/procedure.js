const { Schema } = require("mongoose");
const db = require("../config/database").getUserDB();

const procedureSchema = new Schema(
  {
    specializationId: {
      type: Schema.Types.ObjectId,
      ref: "specializations",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Procedure = db.model("procedures", procedureSchema);

module.exports = {
  model: Procedure,
};
