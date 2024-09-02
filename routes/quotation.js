const express = require("express");
const router = express.Router();
const Middleware = require("../middlewares/userAccess");
const { QuotationInterfaceController } = require("../controllers/quotation");
const { QuotationController } = require("../controllers/quotation");

const quotationInterfaceController  = new QuotationInterfaceController();
const quotationController = new QuotationController();
const userAccess = new Middleware();

router.get("/quotation", userAccess.UserAuth, quotationInterfaceController.RenderIndexPage);

router.get("/quotation/new", userAccess.UserAuth, quotationInterfaceController.RenderQuotationForm);

router.post("/quotation/new", userAccess.UserAuth, quotationController.HandleNewQuotation);

router.get("/quotation/:id", userAccess.UserAuth, quotationInterfaceController.RenderQuotation);

// router.post("/quotation/edit", freightRulesController.HandleUpdateRequest.bind(freightRulesController));

// router.post("/quotation/delete", freightRulesController.HandleDeleteRequest.bind(freightRulesController));

module.exports = router;