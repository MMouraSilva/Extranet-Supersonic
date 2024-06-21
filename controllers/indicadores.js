const express = require("express");
const router = express.Router();
require('dotenv').config();
const backendUrl = process.env.APP_TIMER_HOST; // passar os dados do .env para as constantes
const frontendUrl = process.env.APP_HOST;
const Middleware = require("../middlewares/userAccess");

const userAccess = new Middleware();

router.get("/indicadores", userAccess.UserAuth, (req, res) => {
    res.render("indicadores/indicador", { frontendUrl, backendUrl });
});

router.get("/indicadores/expedicao-cliente-dia", userAccess.UserAuth, (req, res) => {
    res.render("indicadores/indicador_expedicao_dia", { frontendUrl, backendUrl });
});

router.get("/indicadores/igest", userAccess.UserAuth, (req, res) => {
    res.render("indicadores/igest", { frontendUrl, backendUrl });
});

router.get("/indicadores/no-show", userAccess.UserAuth, async (req, res) => {
    res.render("indicadores/no_show", { frontendUrl, backendUrl });
});

router.get("/indicadores/curva-abc", userAccess.UserAuth, async (req, res) => {
    res.render("indicadores/curva_abc", { frontendUrl, backendUrl });
});

module.exports = router;