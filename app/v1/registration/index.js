const { Router } = require("express");
const registrationController = require("./controller");
const {
    validate,
    verifyAuthToken,
    isAdmin,
} = require("../../../middlewares/index"); // Assuming these middlewares are available
const schema = require("./schema"); // Assuming there is a schema for validation

const router = Router({ mergeParams: true });

router.post("/register", validate(schema.signUp), registrationController.createRegistration);
router.post("/changePhone", validate(schema.changePhone), registrationController.changeNumberOtp);
router.post("/changePhoneVerify", validate(schema.changePhoneVerify), registrationController.changeNumberVerifyOtp);
router.post("/verify-otp", validate(schema.verifyOTP), registrationController.verifyOtp);
router.post("/login", validate(schema.login), registrationController.loginUser);



router.post("/verifyForgetPhone", validate(schema.verifyForgetPhone), registrationController.verifyForgetPhone);
router.post("/forgetPhone", validate(schema.forgetPassword), registrationController.forgetPassword);
router.post("/changePasswordForgetPhone", validate(schema.changePasswordForgetPhone), registrationController.changePasswordForgetPhone);





module.exports = router;
