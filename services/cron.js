const { User, EstablishmentMaster, Doctor } = require("../models/index");
const slugify = require("slugify");
const { common } = require("../services/index");

const generateDoctorSlugs = async () => {
  try {
    const doctors = await User.model.aggregate([
      { $match: { userType: { $in: [2] } } },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "userId",
          as: "doctor",
        },
      },
      {
        $unwind: {
          path: "$doctor",
          preserveNullAndEmptyArrays: false,
        },
      },
      { $match: { "doctor.profileSlug": { $exists: false } } },
      {
        $lookup: {
          from: "specializations",
          localField: "doctor.specialization",
          foreignField: "_id",
          as: "specializationMaster",
        },
      },
    ]);
    doctors.map(async (user) => {
      const slugStr =
        user?.fullName + " " + (user?.specializationMaster[0]?.name ?? "");
      const baseSlug = slugify(slugStr.trim(), {
        lower: true,
        remove: undefined,
        strict: true,
      });
      let slug = baseSlug;
      let slugCount = 1;
      while (true && slug !== "undefined") {
        const existingDoctor = await Doctor.model.findOne({
          profileSlug: slug,
        });
        if (!existingDoctor) {
          await common.updateById(Doctor.model, user.doctor._id, {
            profileSlug: slug,
          });
          break;
        }
        slug = `${baseSlug}-${slugCount}`;
        slugCount++;
      }
    });
  } catch (error) {
    console.log(error);
    return false;
  }
};

const generateHospitalSlugs = async () => {
  try {
    const hospitals = await EstablishmentMaster.model.aggregate([
      { $match: { profileSlug: { $exists: false } } },
    ]);
    hospitals.map(async (user) => {
      const slugStr = user?.name + " " + (user?.address?.locality ?? "");
      const baseSlug = slugify(slugStr.trim(), {
        lower: true,
        remove: undefined,
        strict: true,
      });
      let slug = baseSlug;
      let slugCount = 1;
      while (true && slug !== "undefined") {
        const existingEstablishment = await EstablishmentMaster.model.findOne({
          profileSlug: slug,
        });
        if (!existingEstablishment) {
          await common.updateById(EstablishmentMaster.model, user._id, {
            profileSlug: slug,
          });
          break;
        }
        slug = `${baseSlug}-${slugCount}`;
        slugCount++;
      }
    });
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = { generateDoctorSlugs, generateHospitalSlugs };
