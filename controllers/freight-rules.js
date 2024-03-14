require('dotenv').config();
const backendUrl = process.env.APP_TIMER_HOST;
const frontendUrl = process.env.APP_HOST;

class FreightRulesInterfaceController {
    constructor() {
    }

    RenderIndexPage(req, res) {
        res.render("freight-rules/index", { frontendUrl, backendUrl, user: req.session.user });
    }

    RenderCreateForm(req, res) {
        const errorStatus = this.#CheckForErrorsOnSession(req);

        res.render("freight-rules/form", { operation: "create", frontendUrl, backendUrl, user: req.session.user, errorStatus });
    }

    #CheckForErrorsOnSession(req) {
        const createStatus = req.session.createFreightRulesStatus;
        this.#ClearErrorsOnSession(req);

        return createStatus;
    }

    #ClearErrorsOnSession(req) {
        req.session.createFreightRulesStatus = undefined;
    }
}

module.exports = FreightRulesInterfaceController;