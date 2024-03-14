const express = require("express");
const router = express.Router();
const userAccess = require("../middlewares/userAccess");
const FreightRulesInterfaceController = require("../controllers/freight-rules");

const freightRulesController  = new FreightRulesInterfaceController();

router.get("/freight-rules", userAccess, freightRulesController.RenderIndexPage.bind(freightRulesController));

router.get("/freight-rules/create", userAccess, freightRulesController.RenderCreateForm.bind(freightRulesController));

module.exports = router;