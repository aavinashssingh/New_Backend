const { Router } = require("express");
const servicesController = require("./controller");
const {
    validate,
    verifyAuthToken,
    isAdmin,
} = require("../../../middlewares/index");

const router = Router({ mergeParams: true });


router.post("/add-services", verifyAuthToken, servicesController.addServices);
router.get("/get-all-services", verifyAuthToken, servicesController.getAllServices);
module.exports = router;
