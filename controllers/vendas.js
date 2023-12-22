const express = require("express");
const router = express.Router();
require('dotenv').config();
const backendUrl = process.env.APP_TIMER_HOST; // passar os dados do .env para as constantes
const frontendUrl = process.env.APP_HOST;
const userAuth = require("../middlewares/userAuth");

router.get("/vendas", userAuth, (req, res) => {
    res.render("vendas/vendas", { frontendUrl, backendUrl });
});

router.get("/vendas-finalizadas", userAuth, (req, res) => {
    res.render("vendas/vendas_finalizadas", { frontendUrl, backendUrl });
});

module.exports = router;