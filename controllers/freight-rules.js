require('dotenv').config();
const backendUrl = process.env.APP_TIMER_HOST;
const frontendUrl = process.env.APP_HOST;

class FreightRulesInterfaceController {
    constructor() {

    }

    IndexFreightRules(req, res) {
        res.render("freight-rules/index", { frontendUrl, backendUrl, user: req.session.user });
    }
}

module.exports = FreightRulesInterfaceController;