const express = require("express");
const router = express.Router();
require('dotenv').config();
const backendUrl = process.env.APP_TIMER_HOST; // passar os dados do .env para as constantes
const frontendUrl = process.env.APP_HOST;
const Middleware = require("../middlewares/userAccess");

const userAccess = new Middleware();

router.get("/vendas", userAccess.UserAuth, (req, res) => {
    res.render("vendas/vendas", { frontendUrl, backendUrl });
});

router.get("/vendas-finalizadas", userAccess.UserAuth, (req, res) => {
    res.render("vendas/vendas_finalizadas", { frontendUrl, backendUrl });
});

module.exports = router;