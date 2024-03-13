const express = require("express");
const router = express.Router();
const userAccess = require("../middlewares/userAccess");
const FreightRulesInterfaceController = require("../controllers/freight-rules");

const freightRules = new FreightRulesInterfaceController();

router.get("/freight-rules", userAccess, (req, res) => freightRules.IndexFreightRules(req, res));

module.exports = router;