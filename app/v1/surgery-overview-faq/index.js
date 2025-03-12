const { Router } = require("express");
const OverviewfaqController = require("./controller");
const { validate } = require("../../../middlewares/index");
const schema = require("./schema");

const router = Router({ mergeParams: true });

router.post("/", validate(schema.addFAQ), OverviewfaqController.addFAQ);

router.get("/all-faq", OverviewfaqController.allFAQ);

router.get("/:id", validate(schema.findFAQ, 'params'), OverviewfaqController.findFAQ);

router.put("/:id", validate(schema.updateFAQ), OverviewfaqController.updateFAQ);

router.delete("/:id", validate(schema.deleteFAQ, 'params'), OverviewfaqController.deleteFAQ);

module.exports = router;
