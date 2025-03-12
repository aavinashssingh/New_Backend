const { Schema } = require("mongoose");
const { constants } = require("../utils/index");
const db = require("../config/database").getUserDB();

// add here inside the doctors data filyter by surgreies in chnage of service 
const doctorSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    specialization: [
      {
        type: Schema.Types.ObjectId,
        ref: "specializations",
      },
    ],
    email: {
      type: String,
      default: null,
    },
    gender: {
      type: Number,
      enum: constants.GENDER,
    },
    city: {
      type: String,
      default: null,
    },
    isOwnEstablishment: {
      type: Boolean,
      default: false,
    },
    medicalRegistration: [
      {
        registrationNumber: {
          type: String,
          default: null,
        },
        council: {
          type: String,
          default: null,
        },
        year: {
          type: String,
          default: null,
        },
      },
    ],
    education: [
      {
        degree: {
          type: String,
          default: null,
        },
        college: {
          type: String,
          default: null,
        },
        year: {
          type: String,
          default: null,
        },
      },
    ],
    award: [
      {
        name: {
          type: String,
        },
        year: {
          type: String,
          default: null,
        },
      },
    ],
    membership: [
      {
        name: {
          type: String,
          default: null,
        },
      },
    ],
    social: [
      {
        socialMediaId: {
          type: Schema.Types.ObjectId,
          ref: "socialmedias",
          default: null,
        },
        url: {
          type: String,
          default: null,
        },
      },
    ],
    service: [
      {
        name: {
          type: String,
          default: null,
        },
       isSurgery:{               
        type:Boolean,
        default:null,
       }
      },
    ],
    experience: {
      type: String,
      default: null,
    },
    
    identityProof: [
      {
        url: {
          type: String,
          default: null,
        },
        fileType: {
          type: String,
          default: null,
        },
        urlType: {
          type: String,
          default: null,
        },
      },
    ],
    medicalProof: [
      {
        url: {
          type: String,
          default: null,
        },
        fileType: {
          type: String,
          default: null,
        },
        urlType: {
          type: String,
          default: null,
        },
      },
    ],
    establishmentProof: [
      {
        url: {
          type: String,
          default: null,
        },
        fileType: {
          type: String,
          default: null,
        },
        urlType: {
          type: String,
          default: null,
        },
      },
    ],
    profilePic: {
      type: String,
      default: 'https://nector-prod.s3.ap-south-1.amazonaws.com/986d9500-921d-11ef-9eef-990c47d7fcd5-defaultProfilePicNectar.png',
    },
    about: {
      type: String,
      default: null,
    },
    publicUrl: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    totalreviews: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    recommended: {
      type: Number,
      default: 0,
    },
    waitTime: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    status: {
      type: Number,
      enum: constants.DOCTOR_STATUS,
      default: constants.DOCTOR_STATUS.ACTIVE,
    },
    isVerified: {
      type: Number,
      enum: constants.PROFILE_STATUS,
      default: constants.PROFILE_STATUS.PENDING,
    },
    rejectReason: {
      type: String,
    },
    steps: {
      type: Number,
      enum: constants.PROFILE_STEPS,
      default: constants.PROFILE_STEPS.SECTION_B,
    },
    profileScreen: {
      type: Number,
      enum: constants.DOCTOR_SCREENS,
      default: constants.DOCTOR_SCREENS.DOCTOR_DETAILS,
    },
    procedure: [
      {
        type: Schema.Types.ObjectId,
        ref: "proceduremasters",
      },
    ],
    profileSlug: {
      type: String,
    },
    consultationType: {
      type: String,
      enum: [constants.CONSULTATION_TYPES.VIDEO, constants.CONSULTATION_TYPES.IN_CLINIC],
      
    },
    consultationDetails: {
      isVideo: {
        type: Boolean
      },
      isInClinic: {
        type: Boolean
      }
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// doctorSchema.pre("save", async function (next) {
//   if (!this.isNew && (this.name || this.address.address)) {
//     const condition = this._conditions;
//     const establishmentMaster = await this.constructor.findOne(condition);
//     const slugStr =
//       (this.name || establishmentMaster.name) +
//       (this.address.locality || establishmentMaster.address.locality);
//     const baseSlug = slugify(slugStr, { lower: true });
//     let slug = baseSlug;
//     let slugCount = 1;

//     while (true) {
//       const existingEstablishment = await this.constructor.findOne({
//         profileSlug: slug,
//       });
//       if (!existingEstablishment) {
//         this.profileSlug = slug;
//         break;
//       }
//       slug = `${baseSlug}-${slugCount}`;
//       slugCount++;
//     }
//   }
//   next();
// });

const Doctor = db.model("doctors", doctorSchema);

module.exports = {
  model: Doctor,
};
