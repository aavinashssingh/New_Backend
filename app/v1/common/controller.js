const { ObjectId } = require("mongoose").Types;
const httpStatus = require("http-status");
const axios = require('axios');

const {
  common,
  hospital,
  notification,
  doctor,
} = require("../../../services/index");
const { generateAuthJwt } = require("../../../middlewares/index");
const {
  response,
  constants,
  generateOtp,
  generateHash,
  readExcelFile,
  getPagination,
  comparePassword,
} = require("../../../utils/index");
const config = require("../../../config/index");
const {
  Hospital,
  Doctor,
  StateMaster,
  Specialization,
  User,
  HospitalType,
  Notification,
  Patient,
  Admin,
  OTP,
  Session,
  EstablishmentMaster,
  EstablishmentTiming,
  SurgeryMaster,
} = require("../../../models/index");
const { imageUpload } = require("../../../utils/imageUpload");
const sharp = require("sharp");
const slugify = require("slugify");
const environment = config.ENVIRONMENT === constants.SERVER.PROD;
const MYUPCHARAPIKEY = config.MYUPCHARAPIKEY
const { SitemapStream, streamToPromise } = require("sitemap");
const fs = require("fs");
const {
  generateDoctorSlug,
  generateEstablishmentSlug,
} = require("../../../services/doctor");
const fsPromises = require("fs").promises;

const uploadFile = async (req, res, next) => {
  if (!req?.files || !req?.files?.file) {
    return response.error(
      { msgCode: "MISSING_FILE" },
      res,
      httpStatus.BAD_REQUEST
    );
  }
  const file = req?.files?.file[0];
  const ALLOWD_FILES_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/jpg",
    "application/pdf",
  ];
  const ALLOWD_FILES_TYPES_IMAGES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  // Check if the uploaded file is allowed
  if (!ALLOWD_FILES_TYPES.includes(file.mimetype)) {
    return response.error(
      { msgCode: "NOT_VALID_IMAGE" },
      res,
      httpStatus.BAD_REQUEST
    );
  }

  // Allowed file size in mb
  const ALLOWED_FILE_SIZE = 1 * 1024 * 1024;

  if (
    ALLOWD_FILES_TYPES_IMAGES.includes(file.mimetype) &&
    file.size > ALLOWED_FILE_SIZE
  ) {
    file.buffer = await sharp(file.buffer)
      .resize({ fit: "inside", width: 800, height: 800 })
      .toBuffer();
  }
  req.files.file[0] = file;
  return next();
};

const addFile = async (req, res) => {
  try {
    const { fullName } = req.data;
    const file = req?.files?.file[0];
    const fileUpload = await imageUpload(file, fullName || "user");

    if (!fileUpload) {
      response.error({ msgCode: "FILE_NOT_ADDED" }, res, httpStatus.FORBIDDEN);
    }
    response.success(
      { msgCode: "FILE_ADDED", data: { uri: fileUpload } },
      res,
      httpStatus.OK
    );
  } catch (error) {
    console.log(error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

// cognitive complexity
const importDataToDoctor = async (req, res) => {
  try {
    const file = req.files.file[0];
    if (file.mimetype !== "text/csv") {
      return response.error(
        { msgCode: "NOT_VALID_FILE" },
        res,
        httpStatus.BAD_REQUEST
      );
    }
    const { userId } = req.data;
    const rows = await readExcelFile(file.buffer, file.originalname, 2);

    let addedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    let successCount = 0;
    const failedArray = [];

    // const joiSchema =
    for (const row of rows) {
      const phoneExists = await common.getByCondition(User.model, {
        phone: row?.Phone.toString(),
        userType: constants.USER_TYPES.DOCTOR,
      });

      if (row.ChangePhone) {
        const newPhoneExists = await common.getByCondition(User.model, {
          phone: row?.ChangePhone.toString(),
          userType: constants.USER_TYPES.DOCTOR,
          _id: { $ne: new ObjectId(phoneExists?._id) },
        });
        if (newPhoneExists) {
          failedArray.push({
            phone: row?.Phone,
            message: "Phone number already taken.",
          });
          failedCount += 1;
          continue;
        }
      }

      const stateExists = await common.getByCondition(StateMaster.model, {
        name: { $regex: row?.State, $options: "i" },
        isDeleted: false,
      });

      if (!stateExists) {
        failedArray.push({ phone: row?.Phone, message: "Invalid State" });
        failedCount += 1;
        continue;
      }

      const specializationArray = row?.Specialization.toLowerCase()
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.trim() !== "")
        .map((value) => new RegExp(`^${value}$`, "i"));

      const specializationExists = await common.findAll(Specialization.model, {
        name: { $in: specializationArray },
      });

      if (specializationExists?.length === 0) {
        failedArray.push({
          phone: row?.Phone,
          message: "Invalid Specialization",
        });
        failedCount += 1;
        continue;
      }

      const specializationIds = specializationExists.map(
        (specialization) => specialization._id
      );

      const hospitalTypeExists = await common.getByCondition(
        HospitalType.model,
        {
          name: { $regex: row?.HospitalType, $options: "i" },
          isDeleted: false,
        }
      );

      if (!hospitalTypeExists) {
        failedArray.push({
          phone: row?.Phone,
          message: "Invalid Hospital Type",
        });
        failedCount += 1;
        continue;
      }

      const establishmentDetails = await common.getByCondition(
        EstablishmentMaster.model,
        {
          name: { $regex: row?.EstablishmentName, $options: "i" },
        }
      );

      const isOwner = row?.Owner.toLowerCase() === "yes";

      const userType = isOwner
        ? [constants.USER_TYPES.DOCTOR, constants.USER_TYPES.HOSPITAL]
        : [constants.USER_TYPES.DOCTOR];

      let newUser, newDoctor;

      if (phoneExists) {
        // const doctorData = await common.getByCondition(Doctor.model, {
        //   userId: new ObjectId(phoneExists._id),
        // });

        // const hospitalData = await common.getByCondition(Hospital.model, {
        //   userId: new ObjectId(phoneExists._id),
        // });
        // if (doctorData.isOwnEstablishment === isOwner) {
        //   newUser = await common.updateById(User.model, phoneExists._id, {
        //     phone: row?.ChangePhone || phoneExists.phone,
        //     fullName: "Dr." + row?.Name,
        //   });
        //   await common.updateById(Doctor.model, doctorData._id, {
        //     specialization: specializationIds,
        //     userId: newUser._id,
        //     createdBy: new ObjectId(userId),
        //     medicalRegistration: [
        //       {
        //         registrationNumber: row?.RegistrationNumber,
        //         council: row?.RegistrationCouncil,
        //         year: row?.RegistrationYear,
        //       },
        //     ],
        //     education: [
        //       {
        //         degree: row?.Degree,
        //         college: row?.College,
        //         year: row?.YearOfCompletion,
        //       },
        //     ],
        //     experience: row?.Experience.toString(),
        //     isOwnEstablishment: isOwner,
        //     gender: constants.GENDER[row?.Gender.toUpperCase()],
        //   });
        //   if (doctorData.isOwnEstablishment) {
        //     await common.updateById(Hospital.model, hospitalData._id, {
        //       address: {
        //         landmark: row?.Street,
        //         locality: row?.Locality,
        //         city: row?.City,
        //         pincode: row?.Pincode,
        //         state: stateExists?._id,
        //         country: row?.Country,
        //       },
        //       hospitalType: new ObjectId(hospitalTypeExists._id),
        //     });

        //     await common.updateByCondition(
        //       EstablishmentMaster.model,
        //       { hospitalId: new ObjectId(hospitalData._id) },
        //       {
        //         address: {
        //           landmark: row?.Street,
        //           locality: row?.Locality,
        //           city: row?.City,
        //           pincode: row?.Pincode,
        //           state: stateExists?._id,
        //           country: row?.Country,
        //         },
        //         hospitalTypeId: new ObjectId(hospitalTypeExists._id),
        //         name: row?.EstablishmentName,
        //       },
        //       constants.USER_TYPES.HOSPITAL
        //     );
        //   } else if (establishmentDetails) {
        //     const doctorTiming = await common.getByCondition(
        //       EstablishmentTiming.model,
        //       { doctorId: new ObjectId(doctorData._id) }
        //     );
        //     await common.updateById(
        //       EstablishmentTiming.model,
        //       doctorTiming._id,
        //       { establishmentId: new ObjectId(establishmentDetails._id) }
        //     );
        //   } else {
        //     failedArray.push({
        //       phone: row?.Phone,
        //       message: "Establishment not found.",
        //     });
        //     failedCount += 1;
        //     continue;
        //   }
        //   successCount += 1;
        //   updatedCount += 1;
        // } else {
        //   failedArray.push({
        //     phone: row?.Phone,
        //     message: "Cannot update , establishment visit case mismatch.",
        //   });
        //   failedCount += 1;
        //   continue;
        // }

        failedArray.push({
          phone: row?.Phone,
          message: "Cannot update, record already exists.",
        });

        failedCount += 1;
        continue;
      } else {
        newUser = await common.create(User.model, {
          phone: row?.Phone,
          fullName: row?.Name,
          userType,
        });

        newDoctor = await common.create(Doctor.model, {
          specialization: specializationIds,
          userId: newUser._id,
          createdBy: new ObjectId(userId),
          medicalRegistration: [
            {
              registrationNumber: row?.RegistrationNumber,
              council: row?.RegistrationCouncil,
              year: row?.RegistrationYear,
            },
          ],
          education: [
            {
              degree: row?.Degree,
              college: row?.College,
              year: row?.YearOfCompletion,
            },
          ],
          experience: row?.Experience.toString(),
          isOwnEstablishment: isOwner,
          gender: constants.GENDER[row?.Gender.toUpperCase()],
        });

        const profileSlug = await doctor.generateDoctorSlug(newUser._id);

        await common.updateByCondition(
          Doctor.model,
          { _id: newDoctor._id },
          { profileSlug }
        );

        let establishmentId = establishmentDetails?._id;

        const establishmentSlug = await doctor.generateEstablishmentSlug(
          row.EstablishmentName,
          row.Locality || row.City
        );

        if (isOwner) {
          const newHospital = await common.create(Hospital.model, {
            address: {
              landmark: row?.Street,
              locality: row?.Locality,
              city: row?.City,
              pincode: row?.Pincode,
              state: stateExists?._id,
              country: row?.Country,
            },
            hospitalType: new ObjectId(hospitalTypeExists._id),
            userId: newUser._id,
            createdBy: new ObjectId(userId),
          });

          const newEstablishmentMaster = await common.create(
            EstablishmentMaster.model,
            {
              address: {
                landmark: row?.Street,
                locality: row?.Locality,
                city: row?.City,
                pincode: row?.Pincode,
                state: stateExists?._id,
                country: row?.Country,
              },
              hospitalTypeId: new ObjectId(hospitalTypeExists._id),
              hospitalId: newHospital._id,
              createdBy: new ObjectId(userId),
              name: row?.EstablishmentName,
              profileSlug: establishmentSlug,
            }
          );

          await common.create(EstablishmentTiming.model, {
            establishmentId: newEstablishmentMaster?._id,
            isOwner: true,
            isVerified: constants.PROFILE_STATUS.APPROVE,
            createdBy: new ObjectId(userId),
          });
          await common.create(EstablishmentTiming.model, {
            establishmentId: newEstablishmentMaster?._id,
            isOwner: true,
            doctorId: newDoctor._id,
            isVerified: constants.PROFILE_STATUS.APPROVE,
            createdBy: new ObjectId(userId),
          });
        } else {
          if (!establishmentDetails) {
            const newUser = await common.create(User.model, {
              fullName: row?.EstablishmentName,
              userType: [constants.USER_TYPES.HOSPITAL],
              createdBy: new ObjectId(userId),
              phone: "",
            });
            const newHospital = await common.create(Hospital.model, {
              address: {
                landmark: row.Street,
                locality: row.Locality,
                city: row.City,
                pincode: row.Pincode,
                state: stateExists?._id,
                country: row.Country,
              },
              hospitalType: new ObjectId(hospitalTypeExists._id),
              userId: newUser._id,
              createdBy: new ObjectId(userId),
            });
            const newEstablishmentMaster = await common.create(
              EstablishmentMaster.model,
              {
                address: {
                  landmark: row.Street,
                  locality: row.Locality,
                  city: row.City,
                  pincode: row.Pincode,
                  state: stateExists?._id,
                  country: row.Country,
                },
                hospitalTypeId: new ObjectId(hospitalTypeExists._id),
                hospitalId: newHospital._id,
                createdBy: new ObjectId(userId),
                name: row.EstablishmentName,
                profileSlug: establishmentSlug,
              }
            );
            establishmentId = newEstablishmentMaster._id;
            await common.create(EstablishmentTiming.model, {
              establishmentId: newEstablishmentMaster?._id,
              isOwner: true,
              isVerified: constants.PROFILE_STATUS.APPROVE,
              createdBy: new ObjectId(userId),
            });
          }
          await common.create(EstablishmentTiming.model, {
            establishmentId,
            isOwner: false,
            doctorId: newDoctor._id,
            isVerified: constants.PROFILE_STATUS.PENDING,
            createdBy: new ObjectId(userId),
          });
        }
        successCount += 1;
        addedCount += 1;
      }
    }
    response.success(
      {
        msgCode: "FILE_ADDED",
        data: {
          failedCount,
          successCount,
          failedArray,
          addedCount,
          updatedCount,
        },
      },
      res,
      httpStatus.OK
    );
  } catch (error) {
    console.log(error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

const importToHospital = async (
  row,
  userId,
  {
    updatedFailedCount,
    updatedChangedCount,
    updatedAddedCount,
    updatedSuccessCount,
    failedArray,
  }
) => {
  const stateExists = await common.getByCondition(StateMaster.model, {
    name: { $regex: row?.State, $options: "i" },
    isDeleted: false,
  });

  if (!stateExists) {
    failedArray.push({ phone: row?.Phone, message: "Invalid State" });
    return {
      updatedFailedCount: updatedFailedCount + 1,
      updatedChangedCount,
      updatedAddedCount,
      updatedSuccessCount,
      failedArray,
    };
  }

  const phoneExists = await common.getByCondition(User.model, {
    phone: row?.Phone.toString(),
    userType: constants.USER_TYPES.HOSPITAL,
  });

  if (row.ChangePhone) {
    const newPhoneExists = await common.getByCondition(User.model, {
      phone: row?.Phone.toString(),
      userType: constants.USER_TYPES.DOCTOR,
      _id: { $ne: new ObjectId(phoneExists?._id) },
    });

    if (newPhoneExists) {
      failedArray.push({
        phone: row?.Phone,
        message: "New phone number is already taken.",
      });
      return {
        updatedFailedCount: updatedFailedCount + 1,
        updatedChangedCount,
        updatedAddedCount,
        updatedSuccessCount,
        failedArray,
      };
    }
  }

  const hospitalTypeExists = await common.getByCondition(HospitalType.model, {
    name: { $regex: new RegExp(`^${row?.HospitalType}$`, "i") },
    isDeleted: false,
  });

  if (!hospitalTypeExists) {
    failedArray.push({
      phone: row?.Phone,
      message: "Invalid Hospital Type",
    });
    return {
      updatedFailedCount: updatedFailedCount + 1,
      updatedChangedCount,
      updatedAddedCount,
      updatedSuccessCount,
      failedArray,
    };
  }

  let newUser, newHospital, newEstablishmentMaster;

  const establishmentSlug = await generateEstablishmentSlug(
    row.Name,
    row.Locality || row.City
  );

  if (phoneExists) {
    newUser = await common.updateById(User.model, phoneExists._id, {
      phone: row?.ChangePhone || phoneExists.phone,
      fullName: row.Name,
      userType: [constants.USER_TYPES.HOSPITAL],
      createdBy: new ObjectId(userId),
    });

    const hospitalData = await common.getByCondition(Hospital.model, {
      userId: new ObjectId(phoneExists._id),
    });

    newHospital = await common.updateById(Hospital.model, hospitalData._id, {
      address: {
        landmark: row.Street,
        locality: row.Locality,
        city: row.City,
        pincode: row.Pincode,
        state: stateExists?._id,
        country: row.Country,
      },
      hospitalType: new ObjectId(hospitalTypeExists._id),
      userId: newUser._id,
      createdBy: new ObjectId(userId),
    });

    await common.updateByCondition(
      EstablishmentMaster.model,
      { hospitalId: new ObjectId(hospitalData._id) },
      {
        address: {
          landmark: row.Street,
          locality: row.Locality,
          city: row.City,
          pincode: row.Pincode,
          state: stateExists?._id,
          country: row.Country,
        },
        hospitalTypeId: new ObjectId(hospitalTypeExists._id),
        hospitalId: newHospital._id,
        createdBy: new ObjectId(userId),
        name: row.Name,
        profileSlug: establishmentSlug,
      },
      constants.USER_TYPES.HOSPITAL
    );
    updatedChangedCount += 1;
  } else {
    newUser = await common.create(User.model, {
      phone: row.Phone,
      fullName: row.Name,
      userType: [constants.USER_TYPES.HOSPITAL],
      createdBy: new ObjectId(userId),
    });
    newHospital = await common.create(Hospital.model, {
      address: {
        landmark: row.Street,
        locality: row.Locality,
        city: row.City,
        pincode: row.Pincode,
        state: stateExists?._id,
        country: row.Country,
      },
      hospitalType: new ObjectId(hospitalTypeExists._id),
      userId: newUser._id,
      createdBy: new ObjectId(userId),
    });
    newEstablishmentMaster = await common.create(EstablishmentMaster.model, {
      address: {
        landmark: row.Street,
        locality: row.Locality,
        city: row.City,
        pincode: row.Pincode,
        state: stateExists?._id,
        country: row.Country,
      },
      hospitalTypeId: new ObjectId(hospitalTypeExists._id),
      hospitalId: newHospital._id,
      createdBy: new ObjectId(userId),
      name: row.Name,
      profileSlug: establishmentSlug,
    });
    await common.create(EstablishmentTiming.model, {
      establishmentId: newEstablishmentMaster?._id,
      isOwner: true,
      isVerified: constants.PROFILE_STATUS.APPROVE,
      createdBy: new ObjectId(userId),
    });
    updatedAddedCount += 1;
  }
  updatedSuccessCount += 1;
  return {
    updatedFailedCount,
    updatedChangedCount,
    updatedAddedCount,
    updatedSuccessCount,
    failedArray,
  };
};

// cognitive complexity
const importDataToHospital = async (req, res) => {
  try {
    const file = req.files.file[0];
    if (file.mimetype !== "text/csv") {
      return response.error(
        { msgCode: "NOT_VALID_FILE" },
        res,
        httpStatus.BAD_REQUEST
      );
    }
    const { userId } = req.data;
    const rows = await readExcelFile(file.buffer, file.originalname, 1);

    let failedCount = 0;
    let successCount = 0;
    let addedCount = 0;
    let updatedCount = 0;
    let failedArrayReason = [];

    for (const row of rows) {
      const {
        updatedFailedCount,
        updatedChangedCount,
        updatedAddedCount,
        updatedSuccessCount,
        failedArray,
      } = await importToHospital(row, userId, {
        updatedFailedCount: failedCount,
        updatedChangedCount: updatedCount,
        updatedAddedCount: addedCount,
        updatedSuccessCount: successCount,
        failedArray: failedArrayReason,
      });

      failedCount = updatedFailedCount;
      updatedCount = updatedChangedCount;
      addedCount = updatedAddedCount;
      successCount = updatedSuccessCount;
      failedArrayReason = failedArray;
    }

    response.success(
      {
        msgCode: "FILE_ADDED",
        data: {
          failedCount,
          successCount,
          failedArray: failedArrayReason,
          addedCount,
          updatedCount,
        },
      },
      res,
      httpStatus.OK
    );
  } catch (error) {
    console.log(error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

const checkEmailExists = async (req, res) => {
  try {
    const { search } = req.query;
    const condition = {
      $or: [
        {
          email: { $regex: new RegExp(`^${search}$`, "i") },
        },
      ],
      isDeleted: false,
    };
    const dataDoctor = await common.count(Doctor.model, condition);
    const dataAdmin = await common.count(Admin.model, condition);
    const dataPatient = await common.count(Patient.model, condition);
    const msgCode =
      dataDoctor + dataAdmin + dataPatient > 0
        ? "EMAIL_EXISTS"
        : "EMAIL_AVAILABLE";
    return response.success(
      { msgCode, data: { isTaken: dataDoctor + dataAdmin + dataPatient > 0 } },
      res,
      httpStatus.OK
    );
  } catch (error) {
    console.log(error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

const medicalRegistrationExists = async (req, res) => {
  try {
    const { search } = req.query;
    const condition = {
      $or: [
        {
          "medicalRegistration.registrationNumber": {
            $regex: new RegExp(`^${search}$`, "i"),
          },
        },
      ],
    };
    const dataDoctor = await common.count(Doctor.model, condition);
    const msgCode =
      dataDoctor > 0
        ? "MEDICAL_REGISTRATION_EXISTS"
        : "MEDICAL_REGISTRATION_AVAILABLE";
    return response.success(
      { msgCode, data: { isTaken: dataDoctor > 0 } },
      res,
      httpStatus.OK
    );
  } catch (error) {
    console.log(error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

const hospitalListByAddress = async (req, res) => {
  try {
    const { search, sort, page, size, sortOrder } = req.query;
    const condition = {
      userType: constants.USER_TYPES.HOSPITAL,
      status: { $ne: constants.PROFILE_STATUS.DEACTIVATE },
      isDeleted: false,
    };
    const sortCondition = {};
    let sortKey;
    if (constants.NAME_CONSTANT.includes(sort)) sortKey = "lowerName";
    else sortKey = sort === "createdAt" ? "lowerName" : sort;
    sortCondition[`${sortKey}`] = constants.LIST.ORDER.ASC;
    const { offset, limit } = getPagination(page, size);
    const hospitalQuery = {
      "hospital.isVerified": constants.PROFILE_STATUS.APPROVE,
      $or: [
        {
          "establishmentMaster.name": { $regex: new RegExp(search, "i") },
        },
      ],
    };
    const hospitalList = await hospital.hospitalListForAddress(
      condition,
      sortCondition,
      offset,
      limit,
      hospitalQuery
    );
    const msgCode = hospitalList.count === 0 ? "NO_RECORD_FETCHED" : "SUCCESS";
    return response.success(
      { msgCode, data: hospitalList },
      res,
      httpStatus.OK
    );
  } catch (error) {
    console.log(error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

// cognitive complexity
const updateProfileSendOTP = async (req, res) => {
  try {
    const { userType, userId } = req.data;
    const { phone, countryCode, email } = req.body;
    if (phone) {
      const userPhone = await common.getByCondition(User.model, {
        phone,
        countryCode,
        userType,
      });
      if (userPhone) {
        return response.error(
          { msgCode: "PHONE_EXISTS" },
          res,
          httpStatus.FORBIDDEN
        );
      }
      await common.findOTPandDeleteByID(OTP.model, {
        email,
        userType: userType,
      });
    }
    if (email) {
      const emailExists = await common.findEmail({
        email,
      });
      if (emailExists) {
        return response.error(
          { msgCode: "EMAIL_EXISTS" },
          res,
          httpStatus.FORBIDDEN
        );
      }
      await common.findOTPandDeleteByID(OTP.model, {
        email,
        userType: userType,
      });
    }
    const otp = environment
      ? generateOtp(config.DEFAULT_OTP_LENGTH)
      : config.DEFAULT_OTP;
    const hashOtp = await generateHash(otp);
    const savedOtp = await common.create(OTP.model, {
      otp: hashOtp,
      userType,
      phone,
      email,
    });
    if (!savedOtp) {
      return response.error(
        { msgCode: "FAILED_TO_CREATE_OTP" },
        res,
        httpStatus.FORBIDDEN
      );
    }
    const token = generateAuthJwt({
      userId,
      expiresIn: config.expireIn,
      userType,
      phoneNumber: phone,
      emailAccount: email,
      updateType: phone ? 1 : 2,
      fullName: "user",
    });
    if (environment) {
      const sendOtp = await common.sendOtpPhoneOrEmail(
        phone,
        email,
        userId,
        countryCode,
        otp
      );
      if (!sendOtp)
        return response.error(
          { msgCode: "OTP_NOT_SENT", data: {} },
          res,
          httpStatus.FORBIDDEN
        );
    }
    return response.success(
      { msgCode: "OTP_SENT", data: { token, phone, email } },
      res,
      httpStatus.OK
    );
  } catch (error) {
    console.log(error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

const updateProfileVerifyOTP = async (req, res) => {
  try {
    const { userId, phoneNumber, emailAccount, updateType } = req.data;
    const { otp, deviceId, deviceType, deviceToken, browser, os, osVersion } =
      req.body;
    //find user
    const findUser = await common.getByCondition(User.model, {
      _id: new ObjectId(userId),
      isDeleted: false,
    });
    const findPatient = await common.getByCondition(Patient.model, {
      userId: new ObjectId(userId),
    });
    const condition =
      updateType === 1 ? { phone: phoneNumber } : { email: emailAccount };
    const findUserOTP = await common.findObject(OTP.model, condition);
    if (!findUser || !findPatient) {
      return response.success(
        { msgCode: "USER_NOT_FOUND" },
        res,
        httpStatus.NOT_FOUND
      );
    }
    if (!findUserOTP) {
      return response.error(
        { msgCode: "INVALID_OTP" },
        res,
        httpStatus.FORBIDDEN
      );
    }
    const check = comparePassword(otp, findUserOTP?.otp);
    if (!check) {
      return response.error(
        { msgCode: "INVALID_OTP" },
        res,
        httpStatus.NOT_ACCEPTABLE
      );
    }
    if (check && new Date(findUserOTP?.expiresAt).getTime() < Date.now()) {
      return response.error(
        { msgCode: "EXPIRED_OTP" },
        res,
        httpStatus.NOT_ACCEPTABLE
      );
    }
    //empty otp field by updating
    const token = generateAuthJwt({
      userId: findUser?._id,
      userType: findUser?.userType,
      expiresIn: config?.expireIn,
      deviceId,
      deviceType,
      deviceToken,
      tokenType: constants.TOKEN_TYPE.LOGIN,
      fullName: findUser?.fullName,
    });
    await common.create(Session.model, {
      jwt: token,
      userId: findUser?._id,
      deviceId,
      deviceType,
      deviceToken,
      browser,
      os,
      osVersion,
      tokenType: constants.TOKEN_TYPE.LOGIN,
    }); // Removing OTP
    await common.removeById(OTP.model, findUserOTP?._id); // Removing OTP
    if (updateType === 1)
      await common.updateById(User.model, userId, { phone: phoneNumber });
    else
      await common.updateById(Patient.model, findPatient._id, {
        email: emailAccount,
      });
    return response.success(
      {
        msgCode: "OTP_VERIFIED",
        data: {
          token,
          findUser,
          steps: findPatient.steps,
          profileScreen: findPatient.profileScreen,
          approvalStatus: findPatient.isVerified,
          doctorId: null,
          establishmentName: null,
          hospitalTiming: null,
          profilePic: findPatient.profilePic,
        },
      },
      res,
      httpStatus.ACCEPTED
    );
  } catch (error) {
    console.log(error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

const notificationList = async (req, res) => {
  try {
    const { userId, userType } = req.data;
    const { page, size, type } = req.query;
    const condition = { isDeleted: false };
    if (userType === constants.USER_TYPES.ADMIN)
      condition.baseUser = constants.USER_TYPES.ADMIN;
    else {
      condition.receiverId = new ObjectId(userId);
      condition.baseUser = userType;
    }
    if (type) condition.eventType = type;
    const { limit, offset } = getPagination(page, size);
    const notificationList = await notification.notificationList(
      condition,
      offset,
      limit
    );
    const msgCode =
      notificationList.count === 0 ? "NO_RECORD_FETCHED" : "NOTIFICATION_LIST";
    return response.success(
      { msgCode, data: notificationList },
      res,
      httpStatus.OK
    );
  } catch (error) {
    console.log(error);
    return response.error(
      { msgCode: "SOMETHING_WENT_WRONG" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

const changeReadStatus = async (req, res) => {
  try {
    const { notificationId } = req.query;
    const { userId, userType } = req.data;
    const { isRead, isDeleted, isClear, eventType } = req.body;
    const condition = {
      _id: new ObjectId(notificationId),
      receiverId: new ObjectId(userId),
    };
    if (isClear) {
      const removeCondition = {};
      if (userType === constants.USER_TYPES.ADMIN) {
        if (eventType) removeCondition.eventType = eventType;
        removeCondition.userType = userType;
      } else removeCondition.receiverId = new ObjectId(userId);
      const removeMany = await common.updateManyByCondition(
        Notification.model,
        removeCondition,
        { isDeleted: true }
      );
      if (!removeMany)
        return response.error(
          { msgCode: "NOTIFICATION_NOT_FOUND" },
          res,
          httpStatus.NOT_FOUND
        );
      return response.success(
        { msgCode: "SUCCESS", data: removeMany },
        res,
        httpStatus.OK
      );
    }
    const notificationRecord = await common.getByCondition(
      Notification.model,
      condition
    );
    if (!notificationRecord)
      return response.error(
        { msgCode: "NOTIFICATION_NOT_FOUND" },
        res,
        httpStatus.NOT_FOUND
      );

    const updatedNotification = await common.updateByCondition(
      Notification.model,
      condition,
      { isRead, isDeleted }
    );
    if (updatedNotification?.modifiedCount === 0)
      return response.error(
        { msgCode: "UPDATE_ERROR" },
        res,
        httpStatus.BAD_REQUEST
      );

    return response.success(
      { msgCode: "NOTIFICATION_UPDATED" },
      res,
      httpStatus.OK
    );
  } catch (error) {
    console.log(error);
    return response.error(
      { msgCode: "SOMETHING_WENT_WRONG" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

const slugForId = async (req, res) => {
  try {
    // await addSlugForData();
    const { profileSlug, city } = req.query;

    const condition = {
      profileSlug,
    };

    const hospitalSlug = await hospital.slugForId(condition, city);

    const doctorSlug = await doctor.slugForId(condition, city);

    const msgCode =
      !hospitalSlug || !doctorSlug ? "NO_RECORD_FETCHED" : "SUCCESS";

    let data = {},
      userType = null;
    if (hospitalSlug) {
      data = hospitalSlug;
      userType = "hospital";
    }
    if (doctorSlug) {
      data = doctorSlug;
      userType = "doctor";
    }
    return response.success(
      {
        msgCode,
        data: {
          userType,
          data,
        },
      },
      res,
      httpStatus.OK
    );
  } catch (error) {
    console.log(error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};


const generateSiteMap = async (req, res) => {


  try {
    const baseUrl = environment ? config.LIVE_HOST_URL : config.DEV_HOST;

    const fileUrl = "https://beta.myupchar.com/sitemap.tsv";
    const MAX_URLS = 50000; // Limit for a single sitemap file




    // const productsResponse = await axios.get(fileUrl);
    // const tsvData = productsResponse.data;

    // const lines = tsvData.split("\n").filter((line) => line.trim());
    // const headers = lines[0].split("\t");
    // const rows = lines.slice(1).map((line) => {
    //   const values = line.split("\t");
    //   return headers.reduce((obj, header, index) => {
    //     obj[header.trim()] = values[index]?.trim();
    //     return obj;
    //   }, {});
    // });

    // Generate URLs for products
    // const productUrls = rows.map((row) => {
    //   let slug = row.slug || row.name.toLowerCase().replace(/\s+/g, "-");
    //   slug = slug.replace(/-\d+$/, "");
    //   return {
    //     url: `${baseUrl}medicines/details/${row.id}/${slug}`,
    //     updatedAt: new Date().toISOString(),
    //   };
    // });

    // Split product URLs into chunks
    // const productChunks = [];
    // for (let i = 0; i < productUrls.length; i += MAX_URLS) {
    //   productChunks.push(productUrls.slice(i, i + MAX_URLS));
    // }

    // Prepare products data for response
    // const productsData = productChunks.reduce((acc, chunk, index) => {
    //   acc[`products${index + 1}`] = chunk;
    //   return acc;
    // }, {});






    const pathUrl = {
      surgery: "surgeries",
      hospital: "hospital",
      doctor: "doctor",
      medicine: "medicines",

    };

    const surgeryPages = await common.findAll(
      SurgeryMaster.model,
      {
        isDeleted: false,
      },
      { slug: 1, updatedAt: 1 }
    );

    const states = await common.findAll(
      StateMaster.model,
      {
        isDeleted: false,
      },
      { name: 1 }
    );






    const hospitalPages = await hospital.hospitalListSitemap();
    const doctorPages = await doctor.doctorListSitemap();





    // const mediceneCategoriesFromApi = await axios
    //   .get(`https://www.myupchar.com/api/medicine/get_categories?api_key=${MYUPCHARAPIKEY}`)
    //   .then((response) => {
    //     return response.data.data;
    //   })
    //   .catch((err) => {
    //     console.error("Error fetching medicine categories:", err.message || err);
    //     throw new Error("Medicine categories fetch failed");
    //   });



    const specializationPages = await doctor.specializationListSitemap();
    const specializationCities = {};

    const servicePages = await doctor.serviceListSitemap();
    const serviceCities = {};

    const staticPages = [
      "https://nectarplus.health",
      "https://nectarplus.health/about-us/about",
      "https://nectarplus.health/contact-us",
      "https://nectarplus.health/surgeries",
      "https://nectarplus.health/privacy-policy",
      "https://nectarplus.health/terms-conditions",
      "https://nectarplus.health/medicines",
    ];

    let surgeryURLs = [],
      doctorURLs = [],
      // medicineCategoryURLs = [],
      hospitalURLs = [],
      specializationURLs = [],
      serviceURLs = [],
      staticURLs = [],
      cityWiseSpecializationURLs = [];

    staticPages.map((page) => {
      staticURLs.push({
        url: `${page}`,
        updatedAt: new Date().toISOString(),
      });
    });



    states.forEach((state) => {
      // For each state, map the surgery pages
      surgeryPages.forEach((surgery) => {
        surgeryURLs.push({
          url: `${baseUrl}${state.name.toLowerCase().replace(/\s+/g, "-")}/${pathUrl.surgery}/${surgery.slug || ""}`,
          updatedAt: new Date().toISOString(),
        });
      });
    });




    hospitalPages.map((hospital) => {
      if (hospital?.address?.city && hospital?.establishmentName != 'Video Consultation Only')
        hospitalURLs.push({
          url: `${baseUrl}${hospital?.address?.city || "NA"}/${pathUrl.hospital
            }/${hospital?.establishmentProfileSlug || ""}`,
          updatedAt: hospital?.updatedAt,
        });
    });






    doctorPages.map((doctor) => {
      if (doctor?.address?.city)
        doctorURLs.push({
          url: `${baseUrl}${doctor?.address?.city}/${pathUrl.doctor}/${doctor?.doctorProfileSlug || ""
            }`,
          updatedAt: doctor?.updatedAt,
        });
    });



    //   mediceneCategoriesFromApi.forEach((category) => {
    //     const categorySlug = category.name_en.toLowerCase().replace(/\s+/g, "-");

    //     medicineCategoryURLs.push({
    //       url: `${baseUrl}${pathUrl.medicine}/all-medicines/${categorySlug}`,

    //       updatedAt: new Date().toISOString(),
    //     });

    //     category.children?.forEach((subcategory) => {
    //       const subcategorySlug = subcategory.name_en.toLowerCase().replace(/\s+/g, "-");


    //       medicineCategoryURLs.push({
    //         url: `${baseUrl}${pathUrl.medicine}/all-medicines/${categorySlug}/${subcategorySlug}`,
    //         updatedAt: new Date().toISOString(),
    //       });

    //       subcategory.children?.forEach((child) => {
    //         const childSlug = child.name_en.toLowerCase().replace(/\s+/g, "-");


    //         medicineCategoryURLs.push({
    //           url: `${baseUrl}${pathUrl.medicine}/all-medicines/${categorySlug}/${subcategorySlug}/${childSlug}`,
    //           updatedAt: new Date().toISOString(),
    //         });

    //         child.children?.forEach((child) => {
    //           const childChildSlug = child.name_en.toLowerCase().replace(/\s+/g, "-");

    //           medicineCategoryURLs.push({
    //             url: `${baseUrl}${pathUrl.medicine}/all-medicines/${categorySlug}/${subcategorySlug}/${childSlug}/${childChildSlug}`,
    //             updatedAt: new Date().toISOString(),
    //           });


    //       });
    //     });
    //   });
    // })






    specializationPages.map((specialization) => {
      specializationURLs.push({
        url: `${baseUrl}${specialization?._id?.city}/${specialization?._id?.specialization}/${specialization?._id?.locality}`,
      });
      specializationCities[
        `${specialization?._id?.city}/${specialization?._id?.specialization}`
      ] = {
        _id: {
          city: specialization?._id?.city,
          specialization: specialization?._id?.specialization,
        },
      };
    });
    Object.values(specializationCities).map((specialization) => {
      specializationURLs.push({
        url: `${baseUrl}${specialization?._id?.city}/${specialization?._id?.specialization}`,
      });
    });

    servicePages.map((service) => {
      serviceURLs.push({
        url: `${baseUrl}${service?._id?.city}/${service?._id?.service}/${service?._id?.locality}`,
      });
      serviceCities[`${service?._id?.city}/${service?._id?.service}`] = {
        _id: { city: service?._id?.city, service: service?._id?.service },
      };
    });

    Object.values(serviceCities).map((service) => {
      serviceURLs.push({
        url: `${baseUrl}${service?._id?.city}/${service?._id?.service}`,
      });
    });

    const staticCities = [
      "delhi",
      "faridabad",
      "ghaziabad",
      "gurugram",
      "noida",
    ];

    const getAllSpecializations = await common.findAll(
      Specialization.model,
      {
        isDeleted: false,
      },
      { slug: 1 }
    );

    getAllSpecializations.map((specialization) => {
      staticCities.map((city) => {
        cityWiseSpecializationURLs.push({
          url: `${baseUrl}${city}/${specialization?.slug}`,
        });
      });
    });

    response.success(
      {
        data: {
          index: staticURLs,
          surgery: surgeryURLs,
          doctor: doctorURLs,
          // medicines: medicineCategoryURLs,
          hospital: hospitalURLs,
          specialization: recordForArray(specializationURLs),
          service: recordForArray(serviceURLs),
          "city-wise-specialization": cityWiseSpecializationURLs,
        },
      },
      // {
      //   data: {
      //     index: staticURLs,
      //     surgery: surgeryURLs,
      //     doctor: doctorURLs,
      //     // medicines: medicineCategoryURLs,
      //     hospital: hospitalURLs,
      //     specialization: recordForArray(specializationURLs),
      //     service: recordForArray(serviceURLs),
      //     "city-wise-specialization": cityWiseSpecializationURLs,
      //     ...productsData,
      //   },
      // },
      res,
      httpStatus.OK
    );
  } catch (error) {
    console.log(error);
    return response.error(
      { msgCode: "INTERNAL_SERVER_ERROR" },
      res,
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};



const getHealthStatus = async (req, res) => {
  res.status(httpStatus.OK).send("OK");
};

const recordForArray = (array) => {
  let uniqueRecords = array.reduce((acc, obj) => {
    acc[obj.url] = obj;
    return acc;
  }, {});

  return Object.values(uniqueRecords);
};

module.exports = {
  uploadFile,
  addFile,
  importDataToDoctor,
  importDataToHospital,
  checkEmailExists,
  hospitalListByAddress,
  medicalRegistrationExists,
  updateProfileSendOTP,
  updateProfileVerifyOTP,
  notificationList,
  changeReadStatus,
  slugForId,
  generateSiteMap,
  getHealthStatus,
};
