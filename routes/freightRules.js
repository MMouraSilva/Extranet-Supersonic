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

router.get("/freight-rules/edit/:id", userAccess, freightRulesInterfaceController.RenderUpdateForm.bind(freightRulesInterfaceController));

router.post("/freight-rules/edit", freightRulesController.HandleUpdateRequest.bind(freightRulesController));

router.post("/freight-rules/delete", freightRulesController.HandleDeleteRequest.bind(freightRulesController));


module.exports = router;