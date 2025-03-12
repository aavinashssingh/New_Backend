const { Schema } = require("mongoose");
const db = require("../config/database").getUserDB();

const ServiceSchema = new Schema(
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
const Service = db.model("Service", ServiceSchema);

module.exports = {
    model: Service,
};

