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

    RenderIndexPage = async (req, res) => {
        const errorStatus = this.#CheckForErrorsOnSession(req);
        const freightRules = await this.freightRules.GetFreightRules();

        res.render("freight-rules/index", { frontendUrl: this.frontendUrl, backendUrl: this.backendUrl, user: req.locals.user, freightRules, errorStatus });
    }

    RenderCreateForm = (req, res) => {
        const errorStatus = this.#CheckForErrorsOnSession(req);

        res.render("freight-rules/form", { operation: "create", frontendUrl: this.frontendUrl, backendUrl: this.backendUrl, user: req.locals.user, errorStatus });
    }

    RenderUpdateForm = async (req, res) => {
        const errorStatus = this.#CheckForErrorsOnSession(req);
        const freightRule = await this.freightRules.GetFreightRuleById(req.params.id);

        res.render("freight-rules/form", { operation: "edit", frontendUrl: this.frontendUrl, backendUrl: this.backendUrl, user: req.locals.user, freightRule, errorStatus });
    }

    #CheckForErrorsOnSession(req) {
        const createStatus = req.session.FreightRulesErrorStatus;
        this.#ClearErrorsOnSession(req);

        return createStatus;
    }

    #ClearErrorsOnSession(req) {
        req.session.FreightRulesErrorStatus = undefined;
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

    HandleCreateRequest = async (req, res) => {
        this.freightRules.dataModel.SetFreightRule(req.body);
        this.#HandleCreateResponse(req, res, await this.freightRules.CreateFreightRule());
    }

    HandleUpdateRequest = async (req, res) => {
        const id = req.body.id;
        this.freightRules.dataModel.SetFreightRule(req.body);
        this.#HandleUpdateResponse(req, res, await this.freightRules.UpdateFreightRule(id));
    }

    HandleDeleteRequest = async (req, res) => {
        const id = req.body.id;
        this.#RedirectResponse(req, res, await this.freightRules.DeleteFreightRule(id));
    }

    #HandleCreateResponse(req, res, createResponse) {
        if(!createResponse.isFreightRuleValid) {
            this.#RedirectNotValidCreation(req, res);
        } else this.#RedirectResponse(req, res, createResponse);
    }

    #HandleUpdateResponse(req, res, updateResponse) {
        if(!updateResponse.isFreightRuleValid) {
            this.#RedirectNotValidUpdate(req, res);
        } else this.#RedirectResponse(req, res, updateResponse);
    }

    #RedirectNotValidCreation(req, res) {
        req.session.FreightRulesErrorStatus = { completed: false };
        res.redirect("/freight-rules/create");
    }

    #RedirectNotValidUpdate(req, res) {
        req.session.FreightRulesErrorStatus = { completed: false };
        res.redirect("/freight-rules/edit/" + req.body.id);
    }

    #RedirectResponse(req, res, operationResponse) {
        if(!operationResponse.hasSucceed) this.errorHandler.HandleError(operationResponse.error);
        req.session.FreightRulesErrorStatus = { completed: operationResponse.hasSucceed, operation: operationResponse.operation };
        res.redirect("/freight-rules");
    }
}

module.exports = { FreightRulesInterfaceController, FreightRulesController };