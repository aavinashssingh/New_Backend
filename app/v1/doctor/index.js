const { Router } = require("express");

const doctorController = require("./controller");
const {
  validate,
  verifyAuthToken,
  isAdmin,
} = require("../../../middlewares/index");
const schema = require("./schema");

const router = Router({ mergeParams: true });

router.get(
  "/get-all-top-rated-doctors",
  doctorController.getAllTopRatedDoctors
);

router.get(
  "/speciality-first-letter-list/:id",
  doctorController.specialityFirstLetterList
);

router.get("/admin", doctorController.doctorList);

router.get(
  "/speciality/:id",
  // validate(schema.doctorProfile, "query"),
  doctorController.doctorSpeciality
);

router.get("/reviews/:id", doctorController.doctorReviews);

router.get(
  "/profile",
  validate(schema.doctorProfile, "query"),
  doctorController.doctorAboutUs
);


router.get(
  "/getEstablishmentProof",
  doctorController.getEstablishmentProof
);

router.get(
  "/establishment-profile/:id",
  doctorController.doctorListBasedOnProcedure
);

router.get(
  "/establishment-speciality-list/:id",
  doctorController.establishmentspecialityListDoc
);

router.get("/get-all-doctors-by-city", doctorController.getAllDoctorByCity);

router.get("/get-all-specializations", doctorController.getAllSpecializations);

router.put(
  "/doctor-update-profile",
  verifyAuthToken,
  validate(schema.doctorCompleteProfile),
  doctorController.doctorUpdateProfile
);

router.put(
  "/doctor-update-medical-verification",
  verifyAuthToken,
  // validate(schema.doctorCompleteProfile),
  doctorController.doctorUpdateProfile
);

router.get(
  "/get-doctor-profile",
  verifyAuthToken,
  validate(schema.getDoctorProfile, "query"),
  doctorController.getDoctorProfile
);

router.post("/get-calender", verifyAuthToken, doctorController.getCalender);

router.post(
  "/doctor-cancel-appointment",
  verifyAuthToken,
  doctorController.doctorCancelAppointment
);

router.post(
  "/doctor-complete-appointment",
  verifyAuthToken,
  validate(schema.completeAppointment),
  doctorController.doctorCompleteAppointment
);

router.delete(
  "/doctor-delete-appointment",
  validate(schema.completeAppointment, "query"),
  doctorController.doctorDeleteAppointment
);

router.patch(
  "/doctor-edit-appointment",
  verifyAuthToken,
  doctorController.doctorEditAppointment
);

router.get(
  "/doctor-establishment-list",
  verifyAuthToken,
  doctorController.doctorEstablishmentList
);

router.get(
  "/doctor-establishment-list-admin",
  verifyAuthToken,
  isAdmin,
  validate(schema.userId, "query"),
  doctorController.doctorEstablishmentList
);

router.post(
  "/doctor-add-establishment",
  verifyAuthToken,
  doctorController.doctorAddEstablishment
);

router.post(
  "/doctor-add-establishment-admin",
  verifyAuthToken,
  isAdmin,
  doctorController.doctorAddEstablishment
);

router.post(
  "/check-duplicate-timings",
  verifyAuthToken,
  doctorController.checkDuplicateTimings
);

router.get(
  "/establishment-data",
  verifyAuthToken,
  doctorController.establishmentDataDetails
);

router.get(
  "/doctor-establishment-request",
  verifyAuthToken,
  validate(schema.commonList, "query"),
  doctorController.doctorEstablishmentRequest
);

router.get(
  "/doctor-establishment-request-admin",
  verifyAuthToken,
  isAdmin,
  validate(schema.commonListAdmin, "query"),
  doctorController.doctorEstablishmentRequest
);

router.put(
  "/doctor-edit-establishment",
  verifyAuthToken,
  doctorController.doctorEditEstablishment
);

router.put(
  "/doctor-edit-establishment-admin",
  verifyAuthToken,
  isAdmin,
  doctorController.doctorEditEstablishment
);

router.patch(
  "/doctor-accept-establishment",
  verifyAuthToken,
  doctorController.doctorAcceptEstablishment
);

router.patch(
  "/doctor-accept-establishment-admin",
  verifyAuthToken,
  isAdmin,
  doctorController.doctorAcceptEstablishment
);

router.post(
  "/doctor-appointment-dashboard",
  verifyAuthToken,
  doctorController.doctorAppointmentDashboard
);
router.post(
  "/doctor-delete-establishment",
  verifyAuthToken,
  doctorController.deleteEstablishment
);

router.get(
  "/doctor-appointment-list",
  verifyAuthToken,
  validate(schema.doctorPatientList, "query"),
  doctorController.doctorAppointmentList
);

router.post("/get-all-doctors", doctorController.getAllDoctors);
router.get("/get-doctors-surgery", doctorController.getAllsurgryDoctors);

router.post(
  "/admin-add-doctor",
  verifyAuthToken,
  isAdmin,
  doctorController.adminAddDoctor
);

router.get(
  "/admin-doctor-list",
  verifyAuthToken,
  isAdmin,
  validate(schema.adminDoctorList, "query"),
  doctorController.adminDoctorList
);

router.put(
  "/admin-edit-doctor",
  validate(schema.doctorId, "query"),
  verifyAuthToken,
  isAdmin,
  doctorController.adminEditDoctor
);

router.delete(
  "/admin-delete-doctor",
  verifyAuthToken,
  isAdmin,
  doctorController.deleteDocProfileAdmin
);

router.get(
  "/doctor-approval-list",
  verifyAuthToken,
  isAdmin,
  validate(schema.commonList, "query"),
  doctorController.adminDoctorApprovalList
);

router.patch(
  "/admin-action-doctor",
  verifyAuthToken,
  isAdmin,
  validate(schema.adminActionDoctor),
  doctorController.adminActionDoctor
);

router.patch(
  "/admin-active-inactive",
  verifyAuthToken,
  isAdmin,
  validate(schema.doctorId, "query"),
  validate(schema.doctorStatus),
  doctorController.adminActiveInactiveDoctor
);

router.put(
  "/delete-profile",
  verifyAuthToken,
  doctorController.deleteDocProfile
);

router.get("/procedure", verifyAuthToken, doctorController.procedureList);

router.get(
  "/doctor-faq-list-admin",
  verifyAuthToken,
  isAdmin,
  doctorController.doctorFaqList
);

router.get(
  "/procedure-admin",
  verifyAuthToken,
  isAdmin,
  doctorController.procedureList
);

router.post(
  "/procedure",
  verifyAuthToken,
  validate(schema.addProcedure),
  doctorController.addProcedure
);

router.post(
  "/procedure-admin",
  verifyAuthToken,
  validate(schema.addProcedure),
  isAdmin,
  doctorController.addProcedure
);

router.delete(
  "/procedure/:recordId",
  verifyAuthToken,
  validate(schema.procedureByID, "params"),
  doctorController.deleteProcedure
);

router.delete(
  "/procedure-admin/:recordId",
  verifyAuthToken,
  validate(schema.procedureByID, "params"),
  isAdmin,
  doctorController.deleteProcedure
);


router.delete(
  "/deleteDummyDataFromDbFromUserCollection/",
  doctorController.batchDeleteDoctors
);

router.get("/TEST", (req, res) => {
  res.send('This is the about page.');
});




module.exports = router;
