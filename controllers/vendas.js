const express = require("express");
const router = express.Router();
require('dotenv').config();
const backendUrl = process.env.APP_TIMER_HOST; // passar os dados do .env para as constantes
const frontendUrl = process.env.APP_HOST;
const userAccess = require("../middlewares/userAccess");

router.get("/vendas", userAccess, (req, res) => {
    res.render("vendas/vendas", { frontendUrl, backendUrl });
});

router.get("/vendas-finalizadas", userAccess, (req, res) => {
    res.render("vendas/vendas_finalizadas", { frontendUrl, backendUrl });
});

module.exports = router;