const express = require("express");
const router = express.Router();
require('dotenv').config();
const backendUrl = process.env.APP_TIMER_HOST; // passar os dados do .env para as constantes
const frontendUrl = process.env.APP_HOST;
const userAuth = require("../middlewares/userAuth");

router.get("/indicadores", userAuth, (req, res) => {
    res.render("indicadores/indicador", { frontendUrl, backendUrl });
});

router.get("/indicadores/expedicao-cliente-dia", userAuth, (req, res) => {
    res.render("indicadores/indicador_expedicao_dia", { frontendUrl, backendUrl });
});

router.get("/indicadores/igest", userAuth, (req, res) => {
    res.render("indicadores/igest", { frontendUrl, backendUrl });
});

module.exports = router;