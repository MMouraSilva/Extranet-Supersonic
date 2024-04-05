const express = require("express");
const router = express.Router();
const userAccess = require("../middlewares/userAccess");
const { FreightRulesInterfaceController } = require("../controllers/freightRules");
const { FreightRulesController } = require("../controllers/freightRules");

const freightRulesInterfaceController  = new FreightRulesInterfaceController();
const freightRulesController = new FreightRulesController()

router.get("/freight-rules", userAccess, freightRulesInterfaceController.RenderIndexPage.bind(freightRulesInterfaceController));

router.get("/freight-rules/create", userAccess, freightRulesInterfaceController.RenderCreateForm.bind(freightRulesInterfaceController));

router.post("/freight-rules/create", freightRulesController.HandleCreateRequest.bind(freightRulesController));

module.exports = router;