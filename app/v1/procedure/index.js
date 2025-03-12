const { Router } = require("express");
const procedureController = require("./controller");
const {
    validate,
    verifyAuthToken,
    isAdmin,
} = require("../../../middlewares/index");
const schema = require("./schema");

const router = Router({ mergeParams: true });


router.post("/add-procedures", verifyAuthToken, procedureController.addProcedures);
router.get("/get-procedures", verifyAuthToken, procedureController.getProcedures);
router.get("/get-all-procedures", verifyAuthToken, procedureController.getAllProcedures);
module.exports = router;
