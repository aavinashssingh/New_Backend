const { Router } = require("express");
const resetController = require("./controller");
const {
  // validate,
  verifyAuthToken,
  isAdmin,
} = require("../../../middlewares/index"); // Assuming these middlewares are available
const schema = require("./schema"); // Assuming there is a schema for validation

const router = Router({ mergeParams: true });

router.post("/reset-password", resetController.resetPassword);

module.exports = router;
