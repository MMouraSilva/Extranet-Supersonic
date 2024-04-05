require('dotenv').config();
const FreightRules = require("../models/FreightRules");
const ErrorHandler = require("../models/ErrorHandler");

class FreightRulesInterfaceController {
    #backendUrl;
    #frontendUrl;

    constructor() {
        this.freightRules = new FreightRules();
        this.#backendUrl = process.env.APP_TIMER_HOST;
        this.#frontendUrl = process.env.APP_HOST;
    }

    async RenderIndexPage(req, res) {
        const errorStatus = this.#CheckForErrorsOnSession(req);
        const freightRules = await this.freightRules.GetFreightRules();

        res.render("freight-rules/index", { frontendUrl: this.frontendUrl, backendUrl: this.backendUrl, user: req.session.user, freightRules, errorStatus });
    }

    RenderCreateForm(req, res) {
        const errorStatus = this.#CheckForErrorsOnSession(req);

        res.render("freight-rules/form", { operation: "create", frontendUrl: this.frontendUrl, backendUrl: this.backendUrl, user: req.session.user, errorStatus });
    }

    #CheckForErrorsOnSession(req) {
        const createStatus = req.session.createFreightRulesStatus;
        this.#ClearErrorsOnSession(req);

        return createStatus;
    }

    #ClearErrorsOnSession(req) {
        req.session.createFreightRulesStatus = undefined;
    }

    get backendUrl() {
        return this.#backendUrl;
    }

    get frontendUrl() {
        return this.#frontendUrl;
    }
}

class FreightRulesController {
    constructor() {
        this.freightRules = new FreightRules();
        this.errorHandler = new ErrorHandler();
    }

    async HandleCreateRequest(req, res) {
        this.freightRules.dataModel.SetFreightRule(req.body);
        this.#HandleCreateResponse(req, res, await this.freightRules.CreateFreightRule());
    }

    #HandleCreateResponse(req, res, createResponse) {
        if (!createResponse.hasSucceed) {
            this.#HandleCreateError(req, res, createResponse);
        } else this.#RedirectCreationSuccess(req, res);
    }

    #HandleCreateError(req, res, createResponse) {
        if (!createResponse.isFreightRuleValid) this.#RedirectNotValidCreation(req, res);
        else this.#RedirectCreationError(req, res, createResponse.error);
    }

    #RedirectNotValidCreation(req, res) {
        req.session.createFreightRulesStatus = { completed: false };
        res.redirect("/freight-rules/create");
    }

    #RedirectCreationError(req, res, error) {
        this.errorHandler.HandleError(error);
        req.session.createFreightRulesStatus = { completed: false };
        res.redirect("/freight-rules");
    }

    #RedirectCreationSuccess(req, res) {
        req.session.createFreightRulesStatus = { completed: true };
        res.redirect("/freight-rules");
    }
}

module.exports = { FreightRulesInterfaceController, FreightRulesController };