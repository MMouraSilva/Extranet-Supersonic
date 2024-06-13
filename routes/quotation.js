const express = require("express");
const router = express.Router();
const userAccess = require("../middlewares/userAccess");
const { QuotationInterfaceController } = require("../controllers/quotation");
const { QuotationController } = require("../controllers/quotation");

const quotationInterfaceController  = new QuotationInterfaceController();
const quotationController = new QuotationController()

// router.get("/quotation", userAccess, freightRulesInterfaceController.RenderIndexPage.bind(freightRulesInterfaceController));

router.get("/quotation/new", userAccess, quotationInterfaceController.RenderNewQuotationForm.bind(quotationInterfaceController));

// router.post("/quotation/new", freightRulesController.HandleCreateRequest.bind(freightRulesController));

// router.get("/quotation/edit/:id", userAccess, freightRulesInterfaceController.RenderUpdateForm.bind(freightRulesInterfaceController));

// router.post("/quotation/edit", freightRulesController.HandleUpdateRequest.bind(freightRulesController));

// router.post("/quotation/delete", freightRulesController.HandleDeleteRequest.bind(freightRulesController));


module.exports = router;