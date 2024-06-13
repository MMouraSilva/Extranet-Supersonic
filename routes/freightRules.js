const express = require("express");
const router = express.Router();
const Middleware = require("../middlewares/userAccess");
const { FreightRulesInterfaceController } = require("../controllers/freightRules");
const { FreightRulesController } = require("../controllers/freightRules");

const freightRulesInterfaceController  = new FreightRulesInterfaceController();
const freightRulesController = new FreightRulesController()
const userAccess = new Middleware();

router.get("/freight-rules", userAccess.UserAuth, freightRulesInterfaceController.RenderIndexPage);

router.get("/freight-rules/create", userAccess.UserAuth, freightRulesInterfaceController.RenderCreateForm);

router.post("/freight-rules/create", freightRulesController.HandleCreateRequest);

router.get("/freight-rules/edit/:id", userAccess.UserAuth, freightRulesInterfaceController.RenderUpdateForm);

router.post("/freight-rules/edit", freightRulesController.HandleUpdateRequest);

router.post("/freight-rules/delete", freightRulesController.HandleDeleteRequest);


module.exports = router;