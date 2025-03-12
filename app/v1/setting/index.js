const { Router } = require("express");
const settingController = require("./controller");
const { validate, verifyAuthToken, isAdmin } = require("../../../middlewares");
const schema = require("./schema");

const router = Router({ mergeParams: true });

router.get("/profile", verifyAuthToken, settingController.getDoctorProfile);

router.put("/updateUserSteps", verifyAuthToken, settingController.updateProfileSteps);



router.put(
  "/profile",
  verifyAuthToken,
  validate(schema.editDoctorProfile),
  settingController.editDoctorProfile
);



router.get(
  "/profile-admin",
  verifyAuthToken,
  isAdmin,
  settingController.getDoctorProfile
);

router.put(
  "/profile-admin",
  verifyAuthToken,
  isAdmin,
  validate(schema.editDoctorProfile),
  settingController.editDoctorProfile
);

router.get(
  "/record",
  verifyAuthToken,
  validate(schema.recordId, "query"),
  settingController.getDoctorSettingsByID
);

router.get(
  "/list",
  verifyAuthToken,
  validate(schema.recordList, "query"),
  settingController.getDoctorSettingsList
);

router.get(
  "/list-admin",
  verifyAuthToken,
  isAdmin,
  validate(schema.recordListAdmin, "query"),
  settingController.getDoctorSettingsList
);

router.put(
  "/list",
  verifyAuthToken,
  validate(schema.recordId, "query"),
  validate(schema.addDoctorSettings),
  settingController.addDoctorSettings
);

router.put(
  "/list-admin",
  verifyAuthToken,
  validate(schema.recordIdAdmin, "query"),
  validate(schema.addDoctorSettings),
  isAdmin,
  settingController.addDoctorSettings
);

module.exports = router;
